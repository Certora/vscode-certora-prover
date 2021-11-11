import * as vscode from 'vscode'
import { ResultsWebviewProvider } from './ResultsWebviewProvider'
import { SettingsPanel } from './SettingsPanel'

export function activate(context: vscode.ExtensionContext): void {
  const resultsWebviewProvider = new ResultsWebviewProvider(
    context.extensionUri,
  )

  context.subscriptions.push(
    vscode.commands.registerCommand('certora.showSettings', () => {
      SettingsPanel.render(context.extensionUri)
    }),
    vscode.window.registerWebviewViewProvider(
      resultsWebviewProvider.viewType,
      resultsWebviewProvider,
      {
        webviewOptions: {
          retainContextWhenHidden: true,
        },
      },
    ),
  )
}
