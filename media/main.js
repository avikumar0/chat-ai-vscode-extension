(function () {
    const vscode = acquireVsCodeApi();
    const chatLog = document.getElementById('chat-log');
    const chatInput = document.getElementById('chat-input');
    const sendButton = document.getElementById('send-button');

    sendButton.addEventListener('click', () => {
        const message = chatInput.value;
        if (message) {
            vscode.postMessage({ command: 'sendMessage', text: message });
            chatInput.value = '';
            chatInput.style.height = 'auto'; // Reset height after sending
            addMessageToLog('User', message);
        }
    });

    chatInput.addEventListener('keypress', (e) => {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault(); // Prevent newline on Enter without Shift
            sendButton.click();
        }
    });

    chatInput.addEventListener('input', () => {
        chatInput.style.height = 'auto'; // Reset height to auto to recalculate
        chatInput.style.height = (chatInput.scrollHeight) + 'px'; // Adjust height to content
    });

    window.addEventListener('message', event => {
        const message = event.data;
        if (message.command === 'receiveMessage') {
            addMessageToLog('AI', message.text);
        }
    });

    function addMessageToLog(author, text) {
        const messageElement = document.createElement('div');
        messageElement.className = `message ${author.toLowerCase()}`;
        messageElement.innerHTML = `<strong>${author}:</strong> ${text}`;
        chatLog.appendChild(messageElement);
        chatLog.scrollTop = chatLog.scrollHeight;
    }
})();
