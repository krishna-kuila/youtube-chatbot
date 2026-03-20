document.addEventListener("DOMContentLoaded", () => {
    const inputField = document.getElementById("user-input");
    const sendBtn = document.getElementById("send-btn");
    const chatBox = document.getElementById("chat-box");
    const closeBtn = document.getElementById("close-btn");

    // Close Button Logic
    closeBtn.addEventListener("click", () => {
        window.close(); // This tells Chrome to close the extension popup
    });

    // Support hitting "Enter" to send
    inputField.addEventListener("keypress", (e) => {
        if (e.key === "Enter") {
            sendMessage();
        }
    });

    sendBtn.addEventListener("click", sendMessage);

    async function sendMessage() {
        const message = inputField.value.trim();
        if (!message) return;

        // 1. Display User Message
        appendMessage("You", message, "user");
        inputField.value = "";

        // 2. Add a temporary "typing..." indicator
        const typingId = "typing-" + Date.now();
        appendMessage("RAG", "Thinking...", "bot", typingId);

        try {
            // Get YouTube Video ID
            let [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
            
            let videoId = "";
            if (tab.url && tab.url.includes("youtube.com/watch")) {
                const urlParams = new URLSearchParams(new URL(tab.url).search);
                videoId = urlParams.get("v");
            } else {
                removeMessage(typingId);
                appendMessage("System", "Please navigate to a YouTube video.", "bot");
                return;
            }

            // Send to Python Backend
            const response = await fetch("http://127.0.0.1:8000/chat", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ video_id: videoId, message: message })
            });

            const data = await response.json();

            // Remove typing indicator and show real response
            removeMessage(typingId);
            appendMessage("RAG", data.reply, "bot");

        } catch (error) {
            removeMessage(typingId);
            appendMessage("System", "Error: Could not connect to Python backend.", "bot");
            console.error("Error:", error);
        }
    }

    // Helper function to build the chat UI elements
    function appendMessage(sender, text, type, id = null) {
        const wrapper = document.createElement("div");
        wrapper.className = `msg-wrapper ${type}`;
        if (id) wrapper.id = id;

        const label = document.createElement("span");
        label.className = "sender-label";
        label.innerText = sender;

        const bubble = document.createElement("div");
        bubble.className = "msg";
        bubble.innerText = text;

        wrapper.appendChild(label);
        wrapper.appendChild(bubble);
        chatBox.appendChild(wrapper);

        // Auto-scroll to the bottom
        chatBox.scrollTop = chatBox.scrollHeight;
    }

    function removeMessage(id) {
        const element = document.getElementById(id);
        if (element) element.remove();
    }
});