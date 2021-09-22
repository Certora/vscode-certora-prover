import * as vscode from 'vscode'
import { WebviewProvider } from './webview-provider'

export function activate(context: vscode.ExtensionContext) {
  const webviewProvider = new WebviewProvider(context.extensionUri)

  context.subscriptions.push(
    vscode.window.registerWebviewViewProvider(
      webviewProvider.viewType,
      webviewProvider,
    ),
  )
}

export function deactivate() {}
