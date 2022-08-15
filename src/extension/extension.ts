import * as vscode from 'vscode'
import { ResultsWebviewProvider } from './ResultsWebviewProvider'
import { SettingsPanel } from './SettingsPanel'
import { ScriptRunner } from './ScriptRunner'
import { ConfFile, InputFormData, ConfNameMap } from './types'
import { createAndOpenConfFile } from './utils/createAndOpenConfFile'
import { type } from 'os'

export function activate(context: vscode.ExtensionContext): void {
  function showSettings(name: ConfNameMap) {
    const path = vscode.workspace.workspaceFolders?.[0]

    if (!path) return
    const confFileDefault = getDefaultSettings()
    const emptyForm: InputFormData = {
      name: name.fileName,
      mainSolidityFile: '',
      mainContractName: '',
      specFile: '',
      solidityCompiler: '',
      useAdditionalContracts: false,
      additionalContracts: [],
      link: [],
      extendedSettings: [],
      useStaging: false,
      branch: '',
      cacheName: '',
      message: '',
      additionalSettings: [],
    }
    createAndOpenConfFile(emptyForm)
    SettingsPanel.setResultsWebviewProvider(resultsWebviewProvider)
    SettingsPanel.render(context.extensionUri, name, confFileDefault)
  }

  /**
   * get default settings from vscode settings
   */
  function getDefaultSettings(): ConfFile {
    let solcPath: string =
      vscode.workspace.getConfiguration().get('CompilerFolder') || ''
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

    const additionalSettings: string =
      JSON.stringify(
        vscode.workspace.getConfiguration().get('AdditionalSetting'),
      ) || ''

    const typeCheck: boolean | undefined = vscode.workspace
      .getConfiguration()
      .get('LocalTypeChecking')

    const staging: boolean =
      vscode.workspace.getConfiguration().get('Staging') || false

    let branch = ''

    if (staging) {
      branch = vscode.workspace.getConfiguration().get('Branch') || 'master'
    }

    const confFileDefault: ConfFile = {
      solc: solcPath + solc,
      staging: branch,
    }

    if (solcArgs) {
      confFileDefault.solc_args = [solcArgs]
    }
    if (defaultDirectoryForPackagesDependencies) {
      confFileDefault.packages_path = defaultDirectoryForPackagesDependencies
    }
    if (solidityPackageDirectories !== '{}') {
      confFileDefault.packages = solidityPackageDirectories
      console.log(solidityPackageDirectories, 'solidity package dir')
    }
    if (optimisticLoop) {
      confFileDefault.optimistic_loop = true
    }
    if (loopUnroll) {
      confFileDefault.loop_iter = loopUnroll
    }
    if (duration) {
      confFileDefault.smt_timeout = duration
    }
    if (additionalSettings !== '{}') {
      // const settingsArray: string[] = []
      // Object.entries(JSON.parse(additionalSettings)).forEach(([key, value]) => {
      //   if (!key.startsWith('-')) {
      //     key = '-' + key
      //   }
      //   const setting = key + (value ? '=' + value : '')
      //   settingsArray.push(setting)
      // })
      // confFileDefault.settings = settingsArray
      Object.entries(JSON.parse(additionalSettings)).forEach(([key, value]) => {
        confFileDefault[key.toString()] = value as string
      })
    }

    if (!typeCheck) {
      confFileDefault.disableLocalTypeChecking = true
    } else if (typeCheck === true) {
      confFileDefault.disableLocalTypeChecking = false
    }

    return confFileDefault
  }

  async function editConf(name: ConfNameMap): Promise<void> {
    const path = vscode.workspace.workspaceFolders?.[0]
    if (!path) return
    const confFile = getConfFilePath(name.fileName)
    const confFileUri = vscode.Uri.joinPath(path.uri, confFile)
    const decoder = new TextDecoder()
    try {
      const confFileContent = JSON.parse(
        decoder.decode(await vscode.workspace.fs.readFile(confFileUri)),
      )
      SettingsPanel.setResultsWebviewProvider(resultsWebviewProvider)
      SettingsPanel.render(context.extensionUri, name, confFileContent)
    } catch (e) {
      // vscode.window.showErrorMessage(
      //   `Can't read conf file: ${confFile}. Error: ${e}`,
      // )
    }
  }

  async function duplicate(
    toDuplicate: ConfNameMap,
    duplicated: ConfNameMap,
  ): Promise<void> {
    // get the content of the conf to duplicate
    // cretate a new conf file with the name of "duplicated", content of "to duplicate", and open it with settings view
    const path = vscode.workspace.workspaceFolders?.[0]
    if (!path) return
    const confFile = getConfFilePath(toDuplicate.fileName)
    const confFileUri = vscode.Uri.joinPath(path.uri, confFile)
    const decoder = new TextDecoder()
    try {
      const confFileContent: ConfFile = JSON.parse(
        decoder.decode(await vscode.workspace.fs.readFile(confFileUri)),
      )

      try {
        const newConfFilePath = getConfFilePath(duplicated.fileName)
        const newConfFileUri = vscode.Uri.joinPath(path.uri, newConfFilePath)
        const encoder = new TextEncoder()
        const content = encoder.encode(JSON.stringify(confFileContent, null, 2))
        await vscode.workspace.fs.writeFile(newConfFileUri, content)
      } catch (e) {
        // vscode.window.showErrorMessage(`Can't create conf file. Error: ${e}`)
      }
      SettingsPanel.setResultsWebviewProvider(resultsWebviewProvider)
      SettingsPanel.render(context.extensionUri, duplicated, confFileContent)
    } catch (e) {
      // vscode.window.showErrorMessage(
      //   `Can't read conf file: ${confFile}. Error: ${e}`,
      // )
    }
  }

  function getConfFilePath(name: string): string {
    return 'conf/' + name + '.conf'
  }

  async function runScript(name: ConfNameMap) {
    SettingsPanel.removePanel(name.displayName)
    const confFile = getConfFilePath(name.fileName)
    scriptRunner.run(confFile)
  }

  function getConfUri(name: string): vscode.Uri | void {
    const path = vscode.workspace.workspaceFolders?.[0]
    if (!path) return
    const confFile = getConfFilePath(name)
    const confFileUri = vscode.Uri.joinPath(path.uri, confFile)
    return confFileUri
  }

  function deleteConfFile(name: ConfNameMap): void {
    const confFileUri: vscode.Uri | void = getConfUri(name.fileName)
    if (confFileUri) {
      vscode.workspace.fs.delete(confFileUri)
    }
    SettingsPanel.removePanel(name.displayName)
  }

  const resultsWebviewProvider = new ResultsWebviewProvider(
    context.extensionUri,
  )

  resultsWebviewProvider.editConfFile = editConf
  resultsWebviewProvider.openSettings = showSettings
  resultsWebviewProvider.deleteConf = deleteConfFile
  resultsWebviewProvider.duplicate = duplicate
  resultsWebviewProvider.runScript = runScript

  const scriptRunner = new ScriptRunner(resultsWebviewProvider)

  context.subscriptions.push(
    vscode.commands.registerCommand('certora.createConfFile', async () => {
      resultsWebviewProvider.postMessage({
        type: 'create-new-job',
      })
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
