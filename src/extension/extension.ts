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
  JobNameMap,
  CERTORA_INNER_DIR_BUILD,
  CERTORA_INNER_DIR,
  Job,
} from './types'
import { checkDir } from './utils/checkDir'
// import { Run } from '../results/types'
// import { getProgressUrl } from './utils/getProgressUrl'
import { ScriptProgressLongPolling } from './ScriptProgressLongPolling'

export function activate(context: vscode.ExtensionContext): void {
  /**
   * opens the settings webview. only called once, when a new run is created
   * @param name the name of a run to edit, in a type that holds both conf file name
   * and display name of the run
   * @returns null
   */
  async function showSettings(name: JobNameMap) {
    const path = vscode.workspace.workspaceFolders?.[0]
    if (!path) return
    const confFileDefault: ConfFile = getDefaultSettings()
    try {
      const basePath = vscode.workspace.workspaceFolders?.[0]
      if (!basePath) return
      const encoder = new TextEncoder()
      const content = encoder.encode(JSON.stringify(confFileDefault))
      const path = vscode.Uri.joinPath(
        basePath.uri,
        CONF_DIRECTORY_NAME,
        `${name.fileName}.conf`,
      )
      await vscode.workspace.fs.writeFile(path, content)
    } catch (e) {
      // cannot write to conf file
    }
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
      vscode.workspace.getConfiguration().get('Duration') || 300
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
      branch = vscode.workspace.getConfiguration().get('Branch') || ''
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
    if (loopUnroll && loopUnroll !== 1) {
      confFileDefault.loop_iter = loopUnroll
    }
    if (duration && duration !== 300) {
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
        resultsWebviewProvider.postMessage({
          type: 'settings-error',
          payload: name.fileName,
        })
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
   * rename a job
   * @param oldName old job name
   * @param newName new job name
   */
  async function rename(
    oldName: JobNameMap,
    newName: JobNameMap,
  ): Promise<void> {
    const path = vscode.workspace.workspaceFolders?.[0]
    if (!path) return
    const oldConf = vscode.Uri.joinPath(
      path.uri,
      getConfFilePath(oldName.fileName),
    )
    const newConf = vscode.Uri.joinPath(
      path.uri,
      getConfFilePath(newName.fileName),
    )
    try {
      await vscode.workspace.fs.rename(
        vscode.Uri.parse(oldConf.path),
        vscode.Uri.parse(newConf.path),
      )
      scriptRunner.renameRunningScript(
        getConfFilePath(oldName.fileName),
        getConfFilePath(newName.fileName),
      )
      SettingsPanel.removePanel(oldName.displayName)
      await editConf(newName)
    } catch (e) {
      console.log('Cannot rename:', e)
    }
    const lastResultsUri = getLastResultsUri()
    if (lastResultsUri) {
      const oldResultsUri = vscode.Uri.parse(
        lastResultsUri.path + '/' + oldName.fileName + '.json',
      )
      const resultsUri = vscode.Uri.parse(
        lastResultsUri.path + '/' + newName.fileName + '.json',
      )
      try {
        await vscode.workspace.fs.rename(oldResultsUri, resultsUri)
      } catch (e) {
        console.log('Cannot rename:', e)
      }
    }
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
    return path.split('/').pop()?.replace(exe, '') || ''
  }

  async function runScript(name: JobNameMap): Promise<void> {
    SettingsPanel.disableForm(name.displayName)
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
    const deleteAction = `Delete '${name.displayName}' forever`
    vscode.window
      .showInformationMessage(
        `Are you sure you want to delete '${name.displayName}'?`,
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
    await clearResults(name.fileName)

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
        new vscode.RelativePattern(internalUri, '**/*.conf'),
      )
      fileSystemWatcher.onDidCreate(async file => {
        await copyCreatedConf(file)
      })
    } catch (e) {
      console.log('ERROR:', e, '[internal error from  the file system watcher]')
    }
  }

  async function copyCreatedConf(file: vscode.Uri): Promise<void> {
    const strContent = await readShFile(file)
    const jsonContent = JSON.parse(strContent)
    if (jsonContent && jsonContent.build_only) {
      delete jsonContent.build_only
      let verifyStr = ''
      if (typeof jsonContent.verify === 'string') {
        verifyStr = jsonContent.verify
      } else {
        verifyStr = jsonContent.verify[0]
      }
      const reg = /^[0-9_]+$/i
      const pathArr = file.path.split('/')
      const dateAndTime =
        pathArr.find(item => {
          return reg.exec(item)
        }) || ''
      const newConfFileUri = getConfUri(verifyStr.split(':')[0] + dateAndTime)
      if ('staging' in jsonContent && jsonContent.staging === '') {
        jsonContent.staging = ''
      }
      if (newConfFileUri) {
        const encoder = new TextEncoder()
        const content = encoder.encode(JSON.stringify(jsonContent, null, 2))
        await vscode.workspace.fs.writeFile(newConfFileUri, content)
      }
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
          getLastResults(awaitedList)
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
      // add disableLocalTypeChecking flags to conf file, if they don't exist
      if (
        !Object.entries(confFile).find(entry => {
          return entry[0] === 'disableLocalTypeChecking'
        })
      ) {
        try {
          confFile.disableLocalTypeChecking = false
          const encoder = new TextEncoder()
          const content = encoder.encode(JSON.stringify(confFile, null, 2))
          await vscode.workspace.fs.writeFile(file, content)
        } catch (e) {
          console.log('[Inner Error] Failed to write file:', e)
        }
      }
      if (
        confFile.files !== undefined &&
        confFile.verify !== undefined &&
        confFile.files?.length &&
        // verify is not an empty array and not an empty string
        confFile.verify?.length &&
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

  function getLastResultsUri() {
    const path = vscode.workspace.workspaceFolders?.[0]
    if (!path) return
    return vscode.Uri.parse(path.uri.path + CERTORA_INNER_DIR + 'last_results')
  }

  /**
   * read last results from certora inner dir and send them to the results webview
   * @param files names of files
   * @returns void
   */
  function getLastResults(files: ConfToCreate[]) {
    files.forEach(async file => {
      const name = file.fileName
      const internalUri = getLastResultsUri()
      if (!internalUri) return
      const dirExists = await checkDir(internalUri)
      if (dirExists) {
        const confFiles = vscode.workspace.fs.readDirectory(internalUri)
        confFiles.then(f => {
          f.forEach(async fileArr => {
            if (fileArr[0].replace('.json', '') === name) {
              const pathUri = vscode.Uri.parse(
                internalUri.path + '/' + fileArr[0],
              )
              const decoder = new TextDecoder()
              const jsonContent = JSON.parse(
                decoder.decode(await vscode.workspace.fs.readFile(pathUri)),
              )
              const job: Job = jsonContent.data
              job.runName = name
              if (job) {
                const polling = new ScriptProgressLongPolling(
                  resultsWebviewProvider,
                )
                await polling.run(job.progressUrl, name, async data => {
                  data.runName = name
                  resultsWebviewProvider.postMessage<Job>({
                    type: 'receive-new-job-result',
                    payload: data,
                  })
                })
              }
            }
          })
        })
      }
    })
  }

  /**
   * browse for conf files, and than copy these files into [CONF_DIRECTORY]
   */
  async function uploadConf(): Promise<void> {
    const path = vscode.workspace.workspaceFolders?.[0]
    if (!path) return
    // cannot select many because .sh files handling is an asynchronous build
    const options: vscode.OpenDialogOptions = {
      canSelectMany: false,
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
        const fileName = fileArr.pop()
        // let target
        if (fileName?.endsWith('.conf')) {
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

  function askToDeleteResults(name: string): void {
    const deleteAction = `Delete '${name}' last results forever`
    vscode.window
      .showInformationMessage(
        `Are you sure you want to delete '${name}' last results?`,
        {
          modal: true,
          detail: '',
        },
        ...[deleteAction],
      )
      .then(async items => {
        resultsWebviewProvider.postMessage<string>({
          type: 'delete-results',
          payload: name,
        })
        if (items === deleteAction) {
          await clearResults(name)
        }
      })
  }

  /**
   * delete results backup
   * @param name name of results to delete
   */
  async function clearResults(name: string): Promise<void> {
    const lastResultsUri = getLastResultsUri()
    if (lastResultsUri) {
      const resultsUri = vscode.Uri.parse(
        lastResultsUri.path + '/' + name + '.json',
      )
      try {
        await vscode.workspace.fs.delete(resultsUri)
      } catch (e) {
        // can't delete results file
      }
    }
  }

  /**
   * open the log file
   * @param logFile string path to log file
   */
  async function openLogFile(logFile: string): Promise<void> {
    try {
      const logUri = vscode.Uri.parse(logFile)
      const document = await vscode.workspace.openTextDocument(logUri)
      await vscode.window.showTextDocument(document)
    } catch (e) {
      vscode.window.showErrorMessage(
        `Can't read log file: ${logFile}. Error: ${e}`,
      )
    }
  }

  function openExtensionSettings() {
    vscode.commands.executeCommand(
      'workbench.action.openSettings',
      '@ext:certora.vscode-certora-prover',
    )
  }

  function enableEdit(name: JobNameMap) {
    SettingsPanel.enableForm(name.displayName)
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
  resultsWebviewProvider.enableEdit = enableEdit
  resultsWebviewProvider.rename = rename
  resultsWebviewProvider.clearResults = askToDeleteResults
  resultsWebviewProvider.openLogFile = openLogFile

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
