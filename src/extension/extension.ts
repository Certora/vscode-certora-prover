/* ---------------------------------------------------------------------------------------------
 *  This is the main file of the [extension] part. Here, there are the main tasks
 *  of the extension.
 *-------------------------------------------------------------------------------------------- */

import * as vscode from 'vscode'
import { ResultsWebviewProvider } from './ResultsWebviewProvider'
import { SettingsPanel } from './SettingsPanel'
import { ScriptRunner } from './ScriptRunner'
import {
  ConfFile,
  ConfToCreate,
  CONF_DIRECTORY,
  CONF_DIRECTORY_NAME,
  InputFormData,
  JobNameMap,
  CERTORA_INNER_DIR_BUILD,
  CERTORA_INNER_DIR,
} from './types'
import { createConfFile } from './utils/createConfFile'
import { confFileToFormData } from './utils/confFileToInputForm'
import { checkDir } from './utils/checkDir'

export function activate(context: vscode.ExtensionContext): void {
  /**
   * opens the settings webview. only called once, when a new run is created
   * @param name the name of a run to edit, in a type that holds both conf file name
   * and display name of the run
   * @returns null
   */
  function showSettings(name: JobNameMap) {
    const path = vscode.workspace.workspaceFolders?.[0]
    if (!path) return
    const confFileDefault = getDefaultSettings()
    const emptyForm: InputFormData = confFileToFormData(
      confFileDefault,
      name.fileName,
    )
    createConfFile(emptyForm)
    renderSettingsPanel(name, confFileDefault)
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
    const solcArgs: string = JSON.stringify(
      vscode.workspace.getConfiguration().get('SolidityArguments'),
    )

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
    const additionalFlags: string =
      JSON.stringify(
        vscode.workspace.getConfiguration().get('AdditionalFlags'),
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
    if (solcArgs !== '{}') {
      // from object '{'flag': '', 'flag2': 'value2'}' to array of strings ['--flag', '--flag2', 'value2']
      const tempSolcArgs: string[] = []
      const tempArgs = JSON.parse(solcArgs)
      Object.entries(tempArgs).forEach(arg => {
        const tempValue = arg[1]
        tempSolcArgs.push('--' + arg[0].replace('--', ''))
        if (tempValue) {
          tempSolcArgs.push(tempValue.toString())
        }
      })
      confFileDefault.solc_args = tempSolcArgs
    }
    if (defaultDirectoryForPackagesDependencies) {
      confFileDefault.packages_path = defaultDirectoryForPackagesDependencies
    }
    if (solidityPackageDirectories !== '{}') {
      confFileDefault.packages = solidityPackageDirectories
        .replace('{', '')
        .replace('}', '')
        .split(',')
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
    if (additionalFlags !== '{}') {
      Object.entries(JSON.parse(additionalFlags)).forEach(([key, value]) => {
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

  /**
   * open the settings webview to edit the content of a conf file
   * @param name the name of a run to edit, in a type that holds both conf file name
   * and display name of the run
   * @returns Promise<void>
   */
  async function editConf(name: JobNameMap): Promise<void> {
    const confFileUri = getConfUri(name.fileName)
    if (confFileUri) {
      try {
        const confFileContent = await readConf(confFileUri)
        renderSettingsPanel(name, confFileContent)
      } catch (e) {
        vscode.window.showErrorMessage(
          `Can't read conf file: ${confFileUri.path}. Error: ${e}`,
        )
      }
    }
  }

  /**
   * render the settings panel for a conf file, with the name [confName] and the content [confFile]
   * @param confName name of the conf file, in the format: {fileName, displayName}
   * @param confFile content of the conf file
   */
  function renderSettingsPanel(confName: JobNameMap, confFile: ConfFile) {
    SettingsPanel.setResultsWebviewProvider(resultsWebviewProvider)
    SettingsPanel.render(context.extensionUri, confName, confFile)
  }

  /**
   * reads a file and returns it's content - in json format
   * @param confFileUri uri of file to read
   * @returns content of a file
   */
  async function readConf(confFileUri: vscode.Uri): Promise<ConfFile> {
    const decoder = new TextDecoder()
    return JSON.parse(
      decoder.decode(await vscode.workspace.fs.readFile(confFileUri)),
    )
  }

  /**
   * reads a file and returns it's content - in json format
   * @param shFileUri uri of file to read
   * @returns content of a file
   */
  async function readShFile(shFileUri: vscode.Uri): Promise<string> {
    const decoder = new TextDecoder()
    return decoder.decode(await vscode.workspace.fs.readFile(shFileUri))
  }

  /**
   * duplicates a run's conf file, and opens the settings webview of the new run that was created
   * @param toDuplicate the name of a run to duplicate, in a type that holds both conf file name
   * and display name of the run
   * @param duplicated the name of the new duplicated run, in a type that holds both conf file name
   * and display name of the run
   * @returns Promise<void>
   */
  async function duplicate(
    toDuplicate: JobNameMap,
    duplicated: JobNameMap,
    rule?: string,
  ): Promise<void> {
    // get the content of the conf to duplicate
    // create a new conf file with the name of "duplicated", content of "to duplicate", and open it with settings view
    const confFileUri = getConfUri(toDuplicate.fileName)
    if (confFileUri) {
      try {
        const confFileContent = await readConf(confFileUri)

        // the ; is required for the (await) to work, nessesary becasue we have a Promise<ConfFile> type from readConf function return
        confFileContent.msg = ''

        // duplicate the conf file with rule
        if (rule) {
          confFileContent.rule = [rule]
        }

        try {
          const newConfFileUri = getConfUri(duplicated.fileName)
          if (newConfFileUri) {
            const encoder = new TextEncoder()
            const content = encoder.encode(
              JSON.stringify(confFileContent, null, 2),
            )
            await vscode.workspace.fs.writeFile(newConfFileUri, content)
          }
        } catch (e) {
          vscode.window.showErrorMessage(`Can't create conf file. Error: ${e}`)
        }
        if (rule) {
          resultsWebviewProvider.postMessage<string>({
            type: 'run-job',
            payload: duplicated.fileName,
          })
        } else {
          renderSettingsPanel(duplicated, confFileContent)
        }
      } catch (e) {
        vscode.window.showErrorMessage(
          `Can't read conf file: ${confFileUri.path}. Error: ${e}`,
        )
      }
    }
  }

  function getConfFilePath(name: string): string {
    return CONF_DIRECTORY + name + '.conf'
  }

  function getFileName(path: string, exe = '.conf'): string {
    return path.split('/').reverse()[0].replace(exe, '')
  }

  async function runScript(name: JobNameMap) {
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

  /**
   * modal that asks the user if they are sure they want to delete a job named [name]
   * if they are sure - delete conf and send "delete-job" message through the resultsWebviewProvider
   * else - cancel the modal
   * @param name name of the job to delete
   */
  function askToDeleteJob(name: JobNameMap): void {
    const deleteAction = "Delete '" + name.displayName + "' forever"
    vscode.window
      .showInformationMessage(
        "Are you sure you want to delete '" + name.displayName + "'?",
        {
          modal: true,
          detail: 'Job configuration will be lost',
        },
        ...[deleteAction],
      )
      .then(items => {
        if (items === deleteAction) {
          resultsWebviewProvider.postMessage<string>({
            type: 'delete-job',
            payload: name.fileName,
          })
          deleteConfFile(name)
        }
      })
  }

  async function deleteConfFile(name: JobNameMap): Promise<void> {
    const confFileUri: vscode.Uri | void = getConfUri(name.fileName)
    if (confFileUri) {
      try {
        await vscode.workspace.fs.delete(confFileUri)
      } catch (e) {
        // sometimes we call this function just to close the panel
      }
    }

    SettingsPanel.removePanel(name.displayName)
    scriptRunner.removeRunningScriptByName(name.fileName)
  }

  /**
   * This is for the results webview provider.
   * ScriptRunner object has to receive ResultsWebviewProvider object when it is initialized
   * But, ResultsWebviewProvider has to receive resultsWebviewProvider.removeScript = removeRunningScriptByName
   * which is a ScriptRunner method.
   * The solution to the circle is this function, that is passed to ResultsWebviewProvider after ScriptRunner
   * is initialized.
   */
  function removeRunningScriptByName(name: string) {
    scriptRunner.removeRunningScriptByName(name)
  }

  /**
   * run the shell script in [file] with --build_only flag
   * @param file shell script file
   */
  async function convertShToConf(file: vscode.Uri): Promise<void> {
    const path = vscode.workspace.workspaceFolders?.[0]
    if (!path) return
    // write build_only to sh
    let strContent = await readShFile(file)
    // clean content from comments:
    const strArr = strContent.split('\n')
    const cleanArr = strArr
      .map(line => {
        const cleanLine = line.trim()
        if (!cleanLine.startsWith('#')) {
          return line
        }
        return ''
      })
      .filter(n => n)
    strContent = cleanArr.join('\n')
    const searchRegex = /((--verify)|(--assert)|(--bytecode))/g
    const searchMatches = searchRegex.exec(strContent)
    const commandIndex = searchMatches?.index
    if (commandIndex !== undefined) {
      // we look for the next command after "verify"
      const index = strContent.indexOf('--', commandIndex + 3)
      if (index >= 0) {
        strContent =
          strContent.slice(0, index) +
          '--build_only \\\n' +
          strContent.slice(index)
        const encoder = new TextEncoder()
        const content = encoder.encode(strContent)
        const newPath =
          path?.uri.path +
          CERTORA_INNER_DIR_BUILD +
          getFileName(file.path, '.sh')
        const newPathUri = vscode.Uri.parse(newPath)
        await vscode.workspace.fs.writeFile(newPathUri, content)
        await scriptRunner.buildSh(newPath)
        return
      }
    }
    vscode.window.showErrorMessage(
      `You must use either --assert or --verify or --bytecode when running the Certora Prover`,
    )
  }

  /**
   * watch the .certora_internal directory to look for conf that were only build not ran
   * than create conf files for them
   */
  function watchForBuilds(): void {
    const path = vscode.workspace.workspaceFolders?.[0]
    if (!path) return
    try {
      const internalUri = vscode.Uri.parse(path.uri.path + CERTORA_INNER_DIR)
      const fileSystemWatcher = vscode.workspace.createFileSystemWatcher(
        new vscode.RelativePattern(internalUri, '**/.last_confs**/*.conf'),
      )
      fileSystemWatcher.onDidCreate(async file => {
        const strContent = await readShFile(file)
        const jsonContent = JSON.parse(strContent)
        if (jsonContent && jsonContent.build_only) {
          delete jsonContent.build_only
          const newConfFileUri = getConfUri(
            jsonContent.verify[0].split(':')[0] +
              getFileName(file.path).replace('last_conf', ''),
          )
          if ('staging' in jsonContent && jsonContent.staging === '') {
            jsonContent.staging = 'master'
          }
          if (newConfFileUri) {
            const encoder = new TextEncoder()
            const content = encoder.encode(JSON.stringify(jsonContent, null, 2))
            await vscode.workspace.fs.writeFile(newConfFileUri, content)
          }
          await vscode.workspace.fs.delete(file)
        }
      })
    } catch (e) {
      console.log('ERROR:', e, '[internal error from  the file system watcher]')
    }
  }

  /**
   * all conf files in the conf folder will become jobs!
   */
  async function createInitialJobs(): Promise<void> {
    const path = vscode.workspace.workspaceFolders?.[0]
    if (path) {
      watchForBuilds()

      // conf files:
      const confDirectoryPath = path.uri.path + '/' + CONF_DIRECTORY
      const confDirectoryUri = vscode.Uri.parse(confDirectoryPath)
      const checked = await checkDir(confDirectoryUri)
      if (checked) {
        const confFiles = vscode.workspace.fs.readDirectory(confDirectoryUri)
        confFiles.then(async f => {
          const confList = f.map(async file => {
            return await createFileObject(
              vscode.Uri.parse(confDirectoryPath + file[0]),
            )
          })
          const awaitedList = await Promise.all(confList)
          sendFilesToCreateJobs(awaitedList)
        })
      }
    }
    // users can copy conf files to the conf folder and it will create a job!
    // they can also copy files to the script directory and create conf files from them!
    if (path) {
      const confDirectoryToWatch = vscode.Uri.joinPath(
        path.uri,
        CONF_DIRECTORY_NAME,
      )
      createConfWatcher(confDirectoryToWatch)
    }
  }

  function createConfWatcher(directoryToWatch: vscode.Uri) {
    try {
      const fileSystemWatcher = vscode.workspace.createFileSystemWatcher(
        new vscode.RelativePattern(directoryToWatch, '**/*.conf'),
      )
      fileSystemWatcher.onDidCreate(async file => {
        const fileObj: ConfToCreate = await createFileObject(file)
        sendFilesToCreateJobs([fileObj])
      })
      // vscode asks to delete a conf file before is it deleted to avoid mistakes,
      // so I think deleting the job with it is a good idea
      fileSystemWatcher.onDidDelete(file => {
        const nameToRemove = getFileName(
          vscode.workspace.asRelativePath(file.path),
        )
        resultsWebviewProvider.postMessage<string>({
          type: 'delete-job',
          payload: nameToRemove,
        })
      })
    } catch (e) {
      console.log('ERROR:', e, '[internal error from  the file system watcher]')
    }
  }

  /**
   * create an object that holds the name of a file, and if the file is runnable in certora prover
   * @param file uri
   * @returns Promise<ConfToCreate>
   */
  async function createFileObject(file: vscode.Uri): Promise<ConfToCreate> {
    const fileObj: ConfToCreate = {
      fileName: getFileName(vscode.workspace.asRelativePath(file)),
      allowRun: 0,
    }
    try {
      const confFile: ConfFile = await readConf(file)
      // add send_only flag to conf file, if it doesn't exist
      if (!confFile.send_only) {
        try {
          confFile.send_only = true
          const encoder = new TextEncoder()
          const content = encoder.encode(JSON.stringify(confFile))
          await vscode.workspace.fs.writeFile(file, content)
        } catch (e) {}
      }
      if (
        confFile.files !== undefined &&
        confFile.verify !== undefined &&
        confFile.files.length > 0 &&
        confFile.verify?.length > 0 &&
        confFile.solc
      ) {
        fileObj.allowRun = 1
      }
    } catch (e) {
      // listen to file changes
    }
    return fileObj
  }

  /**
   * post message with type: 'initial-jobs'
   * @param files files in the format of {name, allowRun}
   */
  async function sendFilesToCreateJobs(files: ConfToCreate[]) {
    resultsWebviewProvider.postMessage<ConfToCreate[]>({
      type: 'initial-jobs',
      payload: files,
    })
  }

  /**
   * browse for conf files, and than copy these files into [CONF_DIRECTORY]
   */
  async function uploadConf(): Promise<void> {
    const path = vscode.workspace.workspaceFolders?.[0]
    if (!path) return
    const options: vscode.OpenDialogOptions = {
      canSelectMany: true,
      canSelectFolders: false,
      openLabel: 'Open',
      defaultUri: path.uri,
      filters: {
        'File type': ['conf', 'sh'],
      },
    }
    const files = await vscode.window.showOpenDialog(options)
    files?.map(async fileUri => {
      try {
        const fileArr = fileUri.path.split('/')
        const fileName = fileArr.reverse()[0]
        // let target
        if (fileName.endsWith('.conf')) {
          const target = vscode.Uri.joinPath(
            path.uri,
            CONF_DIRECTORY_NAME,
            fileName,
          )
          await vscode.workspace.fs.copy(fileUri, target, { overwrite: true })
          // else if file endswith .sh
        } else {
          await convertShToConf(fileUri)
        }
      } catch (e) {
        console.log("Could'nt copy file", fileUri.path, '\nERROR:', e)
      }
    })
  }

  function openExtensionSettings() {
    vscode.commands.executeCommand(
      'workbench.action.openSettings',
      '@ext:certora.vscode-certora-prover',
    )
  }

  function gotoSupportFeedbackForm() {
    vscode.commands.executeCommand(
      'vscode.open',
      'https://forms.gle/zTadNeJZ7g1vmqFg6',
    )
  }

  const resultsWebviewProvider = new ResultsWebviewProvider(
    context.extensionUri,
  )

  resultsWebviewProvider.editConfFile = editConf
  resultsWebviewProvider.openSettings = showSettings
  resultsWebviewProvider.deleteConf = deleteConfFile
  resultsWebviewProvider.duplicate = duplicate
  resultsWebviewProvider.runScript = runScript
  resultsWebviewProvider.removeScript = removeRunningScriptByName
  resultsWebviewProvider.askToDeleteJob = askToDeleteJob
  resultsWebviewProvider.createInitialJobs = createInitialJobs
  resultsWebviewProvider.uploadConf = uploadConf

  const scriptRunner = new ScriptRunner(resultsWebviewProvider)

  context.subscriptions.push(
    vscode.commands.registerCommand(
      'certora.openSettings',
      openExtensionSettings,
    ),
    vscode.commands.registerCommand(
      'certora.SupportFeedback',
      gotoSupportFeedbackForm,
    ),
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

/** deactivate - to be used in the future maybe */
// eslint-disable-next-line @typescript-eslint/no-empty-function
export function deactivate(): void {}
