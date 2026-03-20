// background.js
chrome.action.onClicked.addListener((tab) => {
    // Send a message to the content script in the active tab
    if (tab.url.includes("youtube.com")) {
        chrome.tabs.sendMessage(tab.id, { action: "toggle_chat" });
    }
});