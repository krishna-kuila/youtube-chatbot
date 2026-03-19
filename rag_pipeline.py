from youtube_transcript_api import YouTubeTranscriptApi
from langchain_community.vectorstores import FAISS
from langchain_text_splitters import RecursiveCharacterTextSplitter
from langchain_core.prompts import PromptTemplate
from langchain_huggingface import HuggingFaceEmbeddings
from huggingface_hub import InferenceClient
from langchain_core.runnables import RunnableParallel, RunnablePassthrough, RunnableLambda
import os
from dotenv import load_dotenv

load_dotenv()

class YouTubeRAG:
    def __init__(self):

        self.__api_key = os.getenv('HUGGINGFACEHUB_API_TOKEN')
        self.__current_video_id = None
        self.__retriever = None
        self.youtubeTranscriptapi = YouTubeTranscriptApi()
        self.splitter = RecursiveCharacterTextSplitter(chunk_size=1000, chunk_overlap=200)

        self.embeddings = HuggingFaceEmbeddings(model="sentence-transformers/all-MiniLM-L6-v2")

        self.client = InferenceClient(
            model="Qwen/Qwen2.5-7B-Instruct",
            provider='together',
            token=self.__api_key
        )
        self.template = PromptTemplate(
            template="""
                you're a helpful assitant.
                Answer only from the provided transcipt context not make answer by self, don't making halucinate answer.
                If the context is insufficient or the question doesn't mention specifiaclly, just say you don't know.

                {context}
                Question: {Question}
            """,
            input_variables=['context', 'Question']
        )
    
    def __format_docs(self, retrieve_docs):
        context_text = '\n\n'.join(doc.page_content for doc in retrieve_docs)
        return context_text
    
    def __llm(self, prompt):
        try:
            response = self.client.chat_completion(
                messages=[
                    {"role": "user", "content": prompt.text}
                ],
                max_tokens=200,
                temperature=0.2
            )
            return response.choices[0].message.content
        except Exception as e:
            return f'Generation error {e}'
        
    def __manage_storage(self, video_id: str):
        if self.__current_video_id == video_id:
            return
        try:
            __transcript_list = self.youtubeTranscriptapi.fetch(video_id, languages=['en'])
            __transcript = ''.join(chunk.text for chunk in __transcript_list)
        except:
            print("No caption available for this video or may in in other language.")

        __chunks = self.splitter.create_documents([__transcript])
        __vector_store = FAISS.from_documents(__chunks, self.embeddings)
        self.__retriever = __vector_store.as_retriever(search_type='similarity')
            

    def get_answer(self, video_id: str, question: str) -> str:
        
        self.__manage_storage(video_id)
        try:

            __parellel_chain = RunnableParallel({
                'context': self.__retriever | RunnableLambda(self.__format_docs),
                'Question': RunnablePassthrough()
            })
            __main_chain = __parellel_chain | self.template | RunnableLambda(self.__llm)
            response = __main_chain.invoke(question)

            return response
        except Exception as e:
            return f'Error:{e}'