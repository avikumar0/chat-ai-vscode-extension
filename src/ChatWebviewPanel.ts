import * as vscode from 'vscode';
import { OpenAI } from 'openai';

export class ChatWebviewPanel {
  public static readonly viewType = 'chatWithAI.chatView';
  private static currentPanel: ChatWebviewPanel | undefined;

  private readonly _panel: vscode.WebviewPanel;
  private readonly _extensionUri: vscode.Uri;
  private _disposables: vscode.Disposable[] = [];

  private messages: string[] = [];
  private openai: OpenAI | undefined;
  private apiKey: string | undefined;

  public static createOrShow(extensionUri: vscode.Uri) {
    const column = vscode.window.activeTextEditor ? vscode.window.activeTextEditor.viewColumn : undefined;

    if (ChatWebviewPanel.currentPanel) {
      ChatWebviewPanel.currentPanel._panel.reveal(column);
    } else {
      const panel = vscode.window.createWebviewPanel(
        ChatWebviewPanel.viewType,
        'Chat with AI',
        column || vscode.ViewColumn.One,
        {
          enableScripts: true,
          localResourceRoots: [vscode.Uri.joinPath(extensionUri, 'media')],
        }
      );

      ChatWebviewPanel.currentPanel = new ChatWebviewPanel(panel, extensionUri);
    }
  }

  private constructor(panel: vscode.WebviewPanel, extensionUri: vscode.Uri) {
    this._panel = panel;
    this._extensionUri = extensionUri;

    this._update();

    this._panel.onDidDispose(() => this.dispose(), null, this._disposables);

    this._panel.webview.onDidReceiveMessage(async (message) => {
      switch (message.command) {
        case 'sendMessage':
          await this.sendMessage(message.text);
          break;
      }
    }, null, this._disposables);

    this.getOpenAIApiInstance();
  }

  private async getOpenAIApiInstance() {
    if (!this.openai) {
      const apiKey = await this.showInputBox();
      if (apiKey) {
        this.apiKey = apiKey;
        this.openai = new OpenAI({ apiKey });
        vscode.workspace.getConfiguration('chatWithAI').update('apiKey', apiKey, true);
      }
    }
    return this.openai;
  }

  private async showInputBox() {
    const result = await vscode.window.showInputBox({
      ignoreFocusOut: true,
      placeHolder: 'Your OpenAI API Key',
      prompt: 'Please enter your OpenAI API key to use the chat-with-AI extension.',
    });
    return result;
  }

  public dispose() {
    ChatWebviewPanel.currentPanel = undefined;

    this._panel.dispose();

    while (this._disposables.length) {
      const x = this._disposables.pop();
      if (x) {
        x.dispose();
      }
    }
  }

  private async sendMessage(message: string) {
    this.messages.push(`User: ${message}`);
    this._update();

    const openai = await this.getOpenAIApiInstance();
    if (openai) {
      try {
        const response = await openai.completions.create({
          model: 'gpt-3.5-turbo',
          prompt: message,
          max_tokens: 150,
        });
        const reply = response.choices[0]?.text?.trim() ?? 'No response';
        this.messages.push(`AI: ${reply}`);
        this._panel.webview.postMessage({ command: 'receiveMessage', text: reply });
      } catch (error) {
        console.error('Failed to get a response from OpenAI:', error);
        this.messages.push('AI: Failed to get a response from OpenAI.');
        this._panel.webview.postMessage({ command: 'receiveMessage', text: 'Failed to get a response from OpenAI.' });
      }
      this._update();
    }
  }

  private _update() {
    const webview = this._panel.webview;
    this._panel.title = 'Chat with AI';
    this._panel.webview.html = this._getHtmlForWebview(webview);
  }

  private _getHtmlForWebview(webview: vscode.Webview) {
    const scriptUri = webview.asWebviewUri(vscode.Uri.joinPath(this._extensionUri, 'media', 'main.js'));
    const styleUri = webview.asWebviewUri(vscode.Uri.joinPath(this._extensionUri, 'media', 'main.css'));
  
    const messagesHtml = this.messages.map(msg => `<p>${msg}</p>`).join('');
  
    return `<!DOCTYPE html>
    <html lang="en">
    <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <link href="${styleUri}" rel="stylesheet">
        <title>Chat with AI</title>
    </head>
    <body>
        <div id="chat-container">
            <div id="chat-log">${messagesHtml}</div>
            <div id="input-container">
                <textarea id="chat-input" placeholder="Type your message here"></textarea>
                <button id="send-button">Send</button>
            </div>
        </div>
        <script src="${scriptUri}"></script>
    </body>
    </html>`;
  }
  
}
