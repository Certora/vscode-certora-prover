import * as vscode from 'vscode'
import { WebviewProvider } from './WebviewProvider'

export function activate(context: vscode.ExtensionContext): void {
  const webviewProvider = new WebviewProvider(context.extensionUri)

  context.subscriptions.push(
    vscode.window.registerWebviewViewProvider(
      webviewProvider.viewType,
      webviewProvider,
    ),
  )
}
