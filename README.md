## Description
RAG based ChatBot for youtube video by using a Browser Plugin. This is the chatbot for specifically design to conversation about any video in Youtube.This is the Chatbot which use python as a backend and HTML, JS as frontend.

### Key Features
1. Can answer any question about the video.
2. Chrome plugin easy to use.

### How to use
1. Step 1: Clone the repository locally by using the below command
   `git clone https://github.com/krishna-kuila/youtube-chatbot.git`
2. Step 2: Create Virtual Environment(.venv) by using the ` python -m venv .venv`(windows) command.
3. Step 3: Create an `.env` file for use secret HuggingFaceHub key.
4. Step 4: Activate venv by using `.venv\Source\Activate`.
5. Step 5: Run ` pip install -r requirements.txt ` command for install the required packages.
6. Step 6: Get the Plugin in your browser by
   . Open your browser
   . Open extension tab and on the > Developer mode.
   . Clicked the > Load Unpacked and choose the > Youtube-rag-extension file.
   . Extension will appear in the extension section.
8. Step 6: Run the Main module by using ` python app.py ` command. This open an FastAPI server where the request sent and get the response.
