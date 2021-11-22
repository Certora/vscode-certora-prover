import * as vscode from 'vscode'
import { spawn } from 'child_process'
import { ResultsWebviewProvider } from './ResultsWebviewProvider'
import { SettingsPanel } from './SettingsPanel'
import {
  ScriptProgressLongPolling,
  ProgressResponse,
} from './utils/ScriptProgressLongPolling'
import { getProgressUrl } from './utils/getProgressUrl'

export function activate(context: vscode.ExtensionContext): void {
  const resultsWebviewProvider = new ResultsWebviewProvider(
    context.extensionUri,
  )
  const polling = new ScriptProgressLongPolling()

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
            const channel = vscode.window.createOutputChannel(
              `certoraRun ${confFile}`,
            )

            const certoraRun = spawn(`certoraRun`, [confFile], {
              cwd: path.uri.fsPath,
            })

            certoraRun.stdout.on('data', async data => {
              const str = data.toString()
              channel.appendLine(str)

              const progressUrl = getProgressUrl(str)

              if (progressUrl) {
                await polling.run(progressUrl, data => {
                  resultsWebviewProvider.postMessage<ProgressResponse>({
                    type: 'receive-new-job-result',
                    payload: data,
                  })
                })
              }
            })

            certoraRun.stderr.on('data', data => {
              vscode.window.showErrorMessage(`${data}`)
            })

            certoraRun.on('error', error => {
              vscode.window.showErrorMessage(`${error}`)
            })

            certoraRun.on('close', code => {
              polling.stop()
              vscode.window.showInformationMessage(
                `certoraRun script exited with code ${code}`,
              )
              channel.clear()
              channel.dispose()
            })

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
