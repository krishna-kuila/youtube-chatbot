from fastapi import FastAPI
from pydantic import BaseModel
from fastapi.middleware.cors import CORSMiddleware
from rag_pipeline import YouTubeRAG

app = FastAPI()

# allow chrome extension to talk to the API
app.add_middleware(
    CORSMiddleware,
    allow_origins=['*'],
    allow_credentials=True,
    allow_methods=['*'],
    allow_headers=['8'],
)

rag_system = YouTubeRAG()

# Structure of the data we expect
class ChatRequest(BaseModel):
    video_id: str
    message: str

@app.post('/chat')
async def chat_endpoint(request: ChatRequest):
    response_text = rag_system.get_answer(request.video_id, request.message)
    return {'reply': response_text}

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host='0.0.0.0', port=8000)
