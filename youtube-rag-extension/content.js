// content.js

// 1. Create the floating UI container
const container = document.createElement("div");
container.id = "rag-chat-container";
container.style.cssText = `
    position: fixed;
    bottom: 20px;
    right: 20px;
    width: 350px;
    height: 500px;
    background-color: #f9f9f9;
    border-radius: 8px;
    box-shadow: 0 4px 12px rgba(0,0,0,0.15);
    display: none; /* Hidden by default */
    flex-direction: column;
    z-index: 999999; /* Stay on top of YouTube */
    font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
    overflow: hidden;
`;

// Inject the HTML designed earlier
container.innerHTML = `
  <div id="rag-header" style="background-color: #ff0000; color: white; padding: 12px 16px; display: flex; justify-content: space-between; align-items: center; cursor: move; font-weight: 600; font-size: 16px;">
    <span>YouTube RAG</span>
    <button id="rag-close-btn" style="background: none; border: none; color: white; font-size: 18px; cursor: pointer;">✕</button>
  </div>
  <div id="rag-chat-box" style="flex: 1; padding: 16px; overflow-y: auto; display: flex; flex-direction: column; gap: 12px; background-color: #ffffff;">
    <div style="align-self: flex-start; max-width: 85%;">
      <span style="font-size: 11px; color: #888;">System</span>
      <div style="background-color: #f1f0f0; color: #333; padding: 10px 14px; border-radius: 18px; border-bottom-left-radius: 4px; font-size: 14px;">Hi! Ask me anything about this video.</div>
    </div>
  </div>
  <div style="padding: 12px; background-color: #ffffff; border-top: 1px solid #ddd; display: flex; gap: 8px;">
    <input type="text" id="rag-user-input" placeholder="Ask a question..." style="flex: 1; padding: 10px 14px; border: 1px solid #ccc; border-radius: 20px; outline: none; font-size: 14px;">
    <button id="rag-send-btn" style="background-color: #007bff; color: white; border: none; border-radius: 20px; padding: 0 16px; cursor: pointer; font-weight: 600;">Send</button>
  </div>
`;

document.body.appendChild(container);

// 2. Drag and Drop Logic
const header = document.getElementById("rag-header");
let isDragging = false;
let currentX, currentY, initialX, initialY;
let xOffset = 0, yOffset = 0;

header.addEventListener("mousedown", dragStart);
document.addEventListener("mouseup", dragEnd);
document.addEventListener("mousemove", drag);

function dragStart(e) {
    initialX = e.clientX - xOffset;
    initialY = e.clientY - yOffset;
    if (e.target === header || e.target.parentElement === header) {
        isDragging = true;
    }
}

function dragEnd(e) {
    initialX = currentX;
    initialY = currentY;
    isDragging = false;
}

function drag(e) {
    if (isDragging) {
        e.preventDefault();
        currentX = e.clientX - initialX;
        currentY = e.clientY - initialY;
        xOffset = currentX;
        yOffset = currentY;
        // Apply the new position
        container.style.transform = `translate(${currentX}px, ${currentY}px)`;
    }
}

// 3. Toggle visibility from Background Script
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
    if (request.action === "toggle_chat") {
        container.style.display = container.style.display === "none" ? "flex" : "none";
    }
});

// Close Button Logic
document.getElementById("rag-close-btn").addEventListener("click", () => {
    container.style.display = "none";
});

// 4. Chat Logic (Same as before, updated with new element IDs)
const inputField = document.getElementById("rag-user-input");
const sendBtn = document.getElementById("rag-send-btn");
const chatBox = document.getElementById("rag-chat-box");

inputField.addEventListener("keypress", (e) => { if (e.key === "Enter") sendMessage(); });
sendBtn.addEventListener("click", sendMessage);

async function sendMessage() {
    const message = inputField.value.trim();
    if (!message) return;

    appendMessage("You", message, "user");
    inputField.value = "";
    const typingId = "typing-" + Date.now();
    appendMessage("RAG", "Thinking...", "bot", typingId);

    try {
        const urlParams = new URLSearchParams(window.location.search);
        const videoId = urlParams.get("v");

        if (!videoId) {
            removeMessage(typingId);
            appendMessage("System", "Please navigate to a YouTube video.", "bot");
            return;
        }

        const response = await fetch("http://127.0.0.1:8000/chat", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ video_id: videoId, message: message })
        });

        const data = await response.json();
        removeMessage(typingId);
        appendMessage("RAG", data.reply, "bot");

    } catch (error) {
        removeMessage(typingId);
        appendMessage("System", "Error: Could not connect to Python backend.", "bot");
    }
}

function appendMessage(sender, text, type, id = null) {
    const wrapper = document.createElement("div");
    wrapper.style.cssText = `align-self: ${type === 'user' ? 'flex-end' : 'flex-start'}; max-width: 85%; margin-bottom: 8px;`;
    if (id) wrapper.id = id;

    const label = document.createElement("span");
    label.style.cssText = `font-size: 11px; color: #888; display: block; text-align: ${type === 'user' ? 'right' : 'left'}; margin-bottom: 2px;`;
    label.innerText = sender;

    const bubble = document.createElement("div");
    bubble.style.cssText = `padding: 10px 14px; border-radius: 18px; font-size: 14px; word-wrap: break-word;`;
    
    if (type === "user") {
        bubble.style.backgroundColor = "#007bff";
        bubble.style.color = "white";
        bubble.style.borderBottomRightRadius = "4px";
    } else {
        bubble.style.backgroundColor = "#f1f0f0";
        bubble.style.color = "#333";
        bubble.style.borderBottomLeftRadius = "4px";
    }
    
    bubble.innerText = text;
    wrapper.appendChild(label);
    wrapper.appendChild(bubble);
    chatBox.appendChild(wrapper);
    chatBox.scrollTop = chatBox.scrollHeight;
}
function removeMessage(id) { const el = document.getElementById(id); if (el) el.remove(); }

// 5. Detect Video Change & Clear Chat UI
let currentFrontendVideoId = new URLSearchParams(window.location.search).get("v");

function resetChatUI() {
    // Overwrite the chat box content with just the default system greeting
    chatBox.innerHTML = `
      <div style="align-self: flex-start; max-width: 85%; margin-bottom: 8px;">
        <span style="font-size: 11px; color: #888; display: block; text-align: left; margin-bottom: 2px;">System</span>
        <div style="background-color: #f1f0f0; color: #333; padding: 10px 14px; border-radius: 18px; border-bottom-left-radius: 4px; font-size: 14px;">
          Switched to a new video! How can I help you with this one?
        </div>
      </div>
    `;
}

// Listen for YouTube's custom navigation event
document.addEventListener('yt-navigate-finish', () => {
    const urlParams = new URLSearchParams(window.location.search);
    const newVideoId = urlParams.get("v");
    
    // If a video is playing AND it's different from the last one we tracked
    if (newVideoId && newVideoId !== currentFrontendVideoId) {
        currentFrontendVideoId = newVideoId; // Update our tracker
        resetChatUI(); // Wipe the chat history
    }
});