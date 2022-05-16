import * as vscode from 'vscode'
import { ResultsWebviewProvider } from './ResultsWebviewProvider'
import { SettingsPanel } from './SettingsPanel'
import { ScriptRunner } from './ScriptRunner'
import { ConfFile } from './types'

export function activate(context: vscode.ExtensionContext): void {
  function showSettings() {
    const path = vscode.workspace.workspaceFolders?.[0]

    if (!path) return
    const confFileDefault = getDefaultSettings()
    SettingsPanel.render(context.extensionUri, confFileDefault)
  }

  /**
   * get default settings from vscode settings
   */
  function getDefaultSettings(): ConfFile {
    let solcPath: string =
      vscode.workspace.getConfiguration().get('Solidity.CompileUsingLocal') ||
      ''
    if (solcPath) {
      solcPath += '/'
    }
    const solc: string =
      vscode.workspace.getConfiguration().get('SolcExecutable') || ''

    const solcArgs: string =
      vscode.workspace.getConfiguration().get('SolidityArguments') || ''

    const defaultDirectoryForPackagesDependencies: string =
      vscode.workspace
        .getConfiguration()
        .get('Solidity.DefaultDirectoryForPackagesDependencies') || ''

    const solidityPackageDirectories: string = JSON.stringify(
      vscode.workspace.getConfiguration().get('SolidityPackageDirectories'),
    )

    const optimisticLoop: boolean | undefined = vscode.workspace
      .getConfiguration()
      .get('OptimisticLoop')

    const loopUnroll: number =
      vscode.workspace.getConfiguration().get('LoopUnroll') || 1

    const duration: number =
      vscode.workspace.getConfiguration().get('Duration') || 600

    const additionalArguments: string =
      JSON.stringify(
        vscode.workspace.getConfiguration().get('AdditionalProperties'),
      ) || ''

    const typeCheck: boolean | undefined = vscode.workspace
      .getConfiguration()
      .get('LocalTypeChecking')

    const staging: string =
      vscode.workspace.getConfiguration().get('Staging') || ''

    const confFileDefault: ConfFile = {
      solc: solcPath + solc,
      staging: staging,
    }

    if (solcArgs) {
      confFileDefault['--solc-args'] = [solcArgs]
    }
    if (defaultDirectoryForPackagesDependencies) {
      confFileDefault['--packages_path'] =
        defaultDirectoryForPackagesDependencies
    }
    if (solidityPackageDirectories !== '{}') {
      confFileDefault['--packages'] = solidityPackageDirectories
    }
    if (optimisticLoop) {
      confFileDefault['--optimistic_loop'] = ''
    }
    if (loopUnroll !== 1) {
      confFileDefault['--loop_iter'] = loopUnroll
    }
    if (duration !== 600) {
      confFileDefault['--smt_timeout'] = duration
    }
    if (additionalArguments) {
      Object.entries(JSON.parse(additionalArguments)).forEach(
        ([key, value]) => {
          confFileDefault[key] = String(value)
        },
      )
    }
    if (!typeCheck) {
      confFileDefault['--typecheck_only'] = ''
    }

    return confFileDefault
  }

  async function quickPickWithConfFiles(
    select: (
      selection: readonly vscode.QuickPickItem[],
      quickPick: vscode.QuickPick<vscode.QuickPickItem>,
      basePath: vscode.WorkspaceFolder,
    ) => void,
  ) {
    const path = vscode.workspace.workspaceFolders?.[0]

    if (!path) return

    const quickPick = vscode.window.createQuickPick()
    const confFiles = await vscode.workspace.findFiles(
      '**/*.{conf}',
      '**/{.certora_config,.git,.last_confs,node_modules}/**',
    )

    if (!confFiles?.length) {
      SettingsPanel.render(context.extensionUri)
    } else {
      quickPick.items = confFiles.map(file => ({
        label: vscode.workspace.asRelativePath(file),
      }))
      quickPick.onDidHide(() => quickPick.dispose())
      quickPick.show()
      quickPick.onDidChangeSelection(selection =>
        select(selection, quickPick, path),
      )
    }
  }

  async function editConfFile() {
    quickPickWithConfFiles(async (selection, quickPick, basePath) => {
      if (selection[0]) {
        quickPick.hide()

        const confFile = selection[0].label
        const confFileUri = vscode.Uri.joinPath(basePath.uri, confFile)
        const decoder = new TextDecoder()

        try {
          const confFileContent = JSON.parse(
            decoder.decode(await vscode.workspace.fs.readFile(confFileUri)),
          )
          SettingsPanel.render(context.extensionUri, confFileContent)
        } catch (e) {
          vscode.window.showErrorMessage(
            `Can't read conf file: ${confFile}. Error: ${e}`,
          )
        }
      }
    })
  }

  async function runScript() {
    quickPickWithConfFiles((selection, quickPick) => {
      if (selection[0]) {
        const confFile = selection[0].label

        if (confFile.includes(' ')) {
          vscode.window.showErrorMessage(
            'The extension does not support path to conf file with spaces. Correct the conf file path and run the script again',
          )
          quickPick.hide()
          return
        }

        scriptRunner.run(confFile)
        quickPick.hide()
      }
    })
  }

  const resultsWebviewProvider = new ResultsWebviewProvider(
    context.extensionUri,
    runScript,
    showSettings,
  )
  const scriptRunner = new ScriptRunner(resultsWebviewProvider)

  context.subscriptions.push(
    vscode.commands.registerCommand('certora.createConfFile', showSettings),
    vscode.commands.registerCommand('certora.editConfFile', editConfFile),
    vscode.commands.registerCommand('certora.runScript', runScript),
    vscode.commands.registerCommand('certora.clearResults', async () => {
      const action = await vscode.window.showInformationMessage(
        'Clear all jobs?',
        'Clear All',
        'Cancel',
      )

      if (action === 'Clear All') {
        resultsWebviewProvider.postMessage({
          type: 'clear-all-jobs',
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

// eslint-disable-next-line @typescript-eslint/no-empty-function
export function deactivate(): void {}
