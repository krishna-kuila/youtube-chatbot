document.getElementById("send-btn").addEventListener("click", async () => {
    const inputField = document.getElementById("user-input");
    const message = inputField.value;
    const chatBox = document.getElementById("chat-box");

    if (!message) return;

    // Display user message in UI
    chatBox.innerHTML += `<div class="msg user"><b>You:</b> ${message}</div>`;
    inputField.value = "";

    try {
        // 1. Get the current active tab to extract the YouTube Video ID
        let [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
        
        let videoId = "";
        if (tab.url.includes("youtube.com/watch")) {
            const urlParams = new URLSearchParams(new URL(tab.url).search);
            videoId = urlParams.get("v");
        } else {
            chatBox.innerHTML += `<div class="msg bot"><b>System:</b> Please navigate to a YouTube video.</div>`;
            return;
        }

        // 2. Send the message and video ID to your Python backend
        const response = await fetch("http://127.0.0.1:8000/chat", {
            method: "POST",
            headers: {
                "Content-Type": "application/json"
            },
            body: JSON.stringify({
                video_id: videoId,
                message: message
            })
        });

        const data = await response.json();

        // 3. Display the RAG response
        chatBox.innerHTML += `<div class="msg bot"><b>RAG:</b> ${data.reply}</div>`;
        chatBox.scrollTop = chatBox.scrollHeight; // Auto-scroll to bottom

    } catch (error) {
        chatBox.innerHTML += `<div class="msg bot"><b>Error:</b> Could not connect to Python backend. Is it running?</div>`;
        console.error("Error:", error);
    }
});