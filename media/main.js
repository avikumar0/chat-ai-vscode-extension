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
            addMessageToLog('User', message);
        }
    });

    chatInput.addEventListener('keypress', (e) => {
        if (e.key === 'Enter') {
            sendButton.click();
        }
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
