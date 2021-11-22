import * as vscode from 'vscode'
import { ResultsWebviewProvider } from './ResultsWebviewProvider'
import { SettingsPanel } from './SettingsPanel'
import { ScriptRunner } from './ScriptRunner'

export function activate(context: vscode.ExtensionContext): void {
  const resultsWebviewProvider = new ResultsWebviewProvider(
    context.extensionUri,
  )
  const scriptRunner = new ScriptRunner(resultsWebviewProvider)

  context.subscriptions.push(
    vscode.commands.registerCommand('certora.showSettings', () => {
      SettingsPanel.render(context.extensionUri)
    }),
    vscode.commands.registerCommand('certora.runScript', async () => {
      const path = vscode.workspace.workspaceFolders?.[0]

      if (!path) return

      const quickPick = vscode.window.createQuickPick()
      const confFiles = await vscode.workspace.findFiles(
        '**/*.{conf}',
        '/{.certora_config,.git,.last_confs,node_modules}/**',
      )

      if (!confFiles?.length) {
        SettingsPanel.render(context.extensionUri)
      } else {
        quickPick.items = confFiles.map(file => ({
          label: vscode.workspace.asRelativePath(file),
        }))
        quickPick.onDidHide(() => quickPick.dispose())
        quickPick.show()
        quickPick.onDidChangeSelection(selection => {
          if (selection[0]) {
            const confFile = selection[0].label
            scriptRunner.run(confFile)
            quickPick.hide()
          }
        })
      }
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
