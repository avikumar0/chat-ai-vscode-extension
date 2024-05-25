import * as vscode from 'vscode';
import { ChatWebviewPanel } from './ChatWebviewPanel';

export function activate(context: vscode.ExtensionContext) {
  context.subscriptions.push(vscode.commands.registerCommand('chatWithAI.sendMessage', () => {
    ChatWebviewPanel.createOrShow(context.extensionUri);
  }));

  // Automatically open the Chat Webview when the extension is activated
  ChatWebviewPanel.createOrShow(context.extensionUri);
}
