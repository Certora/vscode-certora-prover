import * as vscode from 'vscode'
import { WebviewProvider } from './WebviewProvider'
import { SettingsPanel } from './SettingsPanel'

export function activate(context: vscode.ExtensionContext): void {
  const webviewProvider = new WebviewProvider(context.extensionUri)

  context.subscriptions.push(
    vscode.commands.registerCommand('certora.showSettings', () => {
      SettingsPanel.render(context.extensionUri)
    }),
    vscode.window.registerWebviewViewProvider(
      webviewProvider.viewType,
      webviewProvider,
      {
        webviewOptions: {
          retainContextWhenHidden: true,
        },
      },
    ),
  )
}
