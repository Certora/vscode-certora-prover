import { workspace, window, Uri, Diagnostic, Position, Range } from 'vscode'
import * as vscode from 'vscode'
import { spawn, exec, ChildProcessWithoutNullStreams } from 'child_process'
import * as os from 'os'
import { ScriptProgressLongPolling } from './ScriptProgressLongPolling'
import { ResultsWebviewProvider } from './ResultsWebviewProvider'
import { getProgressUrl } from './utils/getProgressUrl'
import type { Job, ResourceError } from './types'

type RunningScript = {
  pid: number
  confFile: string
}

const re = /(\033)|(\[33m)|(\[32m)|(\[31m)|(\[0m)/g

export class ScriptRunner {
  private readonly polling: ScriptProgressLongPolling
  private readonly resultsWebviewProvider: ResultsWebviewProvider
  private script: ChildProcessWithoutNullStreams | null = null
  private runningScripts: RunningScript[] = []
  private diagnosticCollection: vscode.DiagnosticCollection[] = []

  constructor(resultsWebviewProvider: ResultsWebviewProvider) {
    this.polling = new ScriptProgressLongPolling()
    this.resultsWebviewProvider = resultsWebviewProvider

    // TODO: Find better solution
    this.resultsWebviewProvider.stopScript = this.stop
  }

  private getConfFileName(path: string): string {
    const splitedPathToConfFile = path.split('/')
    return splitedPathToConfFile[splitedPathToConfFile.length - 1]
  }

  /**
   * returns a uri of the conf.log file if the workspace path exists, null otherwise
   * @param pathToConfFile path to the .conf file (relative)
   * @param ts the time the file was created
   * @returns the full path to the conf.log file or null
   */
  private getConfFileUri(pathToConfFile: string, ts: number) {
    const path = workspace.workspaceFolders?.[0]
    if (!path) return

    const logFilePath = Uri.joinPath(
      path.uri,
      'certora-logs',
      `${this.getConfFileName(pathToConfFile)}-${ts}.log`,
    )
    return logFilePath
  }

  private async log(
    str: string,
    pathToConfFile: string,
    ts: number,
  ): Promise<void> {
    const logFilePath = this.getConfFileUri(pathToConfFile, ts)
    if (!logFilePath) {
      return
    }
    const encoder = new TextEncoder()
    const content = encoder.encode(str)

    let file

    try {
      file = await workspace.fs.readFile(logFilePath)
    } catch (e) {
    } finally {
      if (file) {
        await workspace.fs.writeFile(
          logFilePath,
          new Uint8Array([...file, ...content]),
        )
      } else {
        await workspace.fs.writeFile(logFilePath, content)
      }
    }
  }

  public run(confFile: string): void {
    this.diagnosticCollection.forEach(collection => {
      collection.clear()
      collection.dispose()
    })
    this.diagnosticCollection = []

    const path = workspace.workspaceFolders?.[0]

    if (!path) return

    const ts = Date.now()
    const channel = window.createOutputChannel(
      `Certora IDE - ${confFile}-${ts}`,
    )
    this.script = spawn(`certoraRun`, [confFile], {
      cwd: path.uri.fsPath,
    })
    const { pid } = this.script
    this.addRunningScript(confFile, pid)

    if (this.script) {
      window
        .showInformationMessage(
          `The script with the conf file ${confFile} has been launched`,
          'Show The Script Output',
        )
        .then(action => {
          if (action === 'Show The Script Output') {
            channel.show()
          }
        })

      this.script.stdout.on('data', async data => {
        let str = data.toString() as string
        // remove all the bash color characters
        str = str.replace(re, '')
        this.log(str, confFile, ts)
        channel.appendLine(str)

        const progressUrl = getProgressUrl(str)

        if (progressUrl) {
          await this.polling.run(progressUrl, data => {
            this.resultsWebviewProvider.postMessage<Job>({
              type: 'receive-new-job-result',
              payload: data,
            })
          })
        }
      })

      this.script.stderr.on('data', data => {
        window.showErrorMessage(`${data}`)
        this.removeRunningScript(pid)
      })

      this.script.on('error', error => {
        window.showErrorMessage(`${error}`)
        this.removeRunningScript(pid)
      })

      this.script.on('close', async code => {
        this.removeRunningScript(pid)

        if (code !== 0) {
          this.postProblems(confFile, ts)
        }

        const action = await window.showInformationMessage(
          `The script for the conf file ${confFile} exited with code ${code}.`,
          'Open Execution Log File',
        )

        if (action === 'Open Execution Log File') {
          const logFilePath = Uri.joinPath(
            path.uri,
            'certora-logs',
            `${this.getConfFileName(confFile)}-${ts}.log`,
          )
          const document = await workspace.openTextDocument(logFilePath)
          await window.showTextDocument(document)
        }
      })
    }
  }

  public stop = (pid: number): void => {
    const command =
      os.platform() === 'win32'
        ? `taskkill -F -T -PID ${pid}`
        : `kill -15 ${pid}`

    exec(command)
  }

  private addRunningScript(confFile: string, pid: number): void {
    this.runningScripts.push({
      confFile,
      pid,
    })
    this.sendRunningScriptsToWebview()
  }

  private removeRunningScript(pid: number): void {
    this.runningScripts = this.runningScripts.filter(
      script => script.pid !== pid,
    )
    this.sendRunningScriptsToWebview()
  }

  private sendRunningScriptsToWebview(): void {
    this.resultsWebviewProvider.postMessage<RunningScript[]>({
      type: 'running-scripts-changed',
      payload: this.runningScripts,
    })
  }

  /**
   * This function is in charged of posting errors from 'resource_errors.json' to vscode 'PROBLEMS'
   * @param confFile relative path to the .conf file of the current run
   * @param ts the time stamp when the run happened
   * @returns an empty promise
   */
  private async postProblems(confFile: string, ts: number): Promise<void> {
    const ignoreFolderRegex =
      '{**/certora-logs,**/conf,**/.github,cache,**/.last_confs,**/.certora_config,**/images}'
    const resourceErrorsFile = 'resource_errors.json'
    const found = await vscode.workspace.findFiles(
      '**/' + resourceErrorsFile,
      ignoreFolderRegex,
      1,
    )
    if (!found || !found[0]) {
      console.error(
        "Could't find the " +
          resourceErrorsFile +
          ' file. Please contact Certora team',
      )
      return
    }

    const data = await vscode.workspace.fs.readFile(found[0])
    if (!data) {
      console.error(
        "Couldn't locate the error logs. Please contact Certora team",
      )
      return
    }

    const decoder = new TextDecoder()
    const content = decoder.decode(data)
    const resource_error = this.getResourceError(content)
    if (resource_error.topics.length === 0) {
      return
    }

    this.createAndPostDiagnostics(resource_error, confFile, ts)
  }

  /**
   * Creates the diagnostics and posts them.
   * A diagnostic will link to the file the error originated from if a path to such file exists in the message.
   * If not - the diagnostic will link to the .conf.log file of the current run.
   * @param resource_error json content of resource_error.json
   * @param confFile a relative path to this run .conf file
   * @param ts the timestamp of the current run
   */
  private async createAndPostDiagnostics(
    resource_error: ResourceError,
    confFile: string,
    ts: number,
  ): Promise<void> {
    /**
     * regex to find a file path in a string. example:
     * string: "BankLesson/Bank.sol:22:5: ParserError: Expected ';' but got 'function'"
     * pathRegex will find: BankLesson/Bank.sol
     */
    const pathRegex = /([a-z0-9_\-\\/.]+)\.([a-z0-9]+)/i
    const locationRegex = /((:\d+:\d+:)|(:\d+:\d+))/g

    const diagnosticMap: Map<string, vscode.Diagnostic[]> = new Map()

    for (const topic of resource_error.topics) {
      for (const message of topic.messages) {
        const curMessage: string = message.message

        const path = pathRegex.exec(curMessage)
        const location = locationRegex.exec(curMessage)
        const uri = await this.getPathToProblem(path, confFile, ts)

        const confFileUri = this.getConfFileUri(confFile, ts)

        const descriptiveMessage = curMessage
          .replace(pathRegex, '')
          .replace(locationRegex, '')
          .replace(' ()', '') // for dealing with spec file errors
        const position: Position = this.getPosition(
          location,
          uri.path,
          confFile,
          ts,
        )

        /**
         * right now we are only getting the start position from the resource_errors.json message
         * vscode handles this range by emphasizing the words that start at position [position]
         */
        const range: Range = new Range(position, position)
        const diagnostic = new Diagnostic(range, descriptiveMessage)

        const diagnostics: Diagnostic[] = diagnosticMap.get(uri.path) || []
        diagnostics.push(diagnostic)
        diagnosticMap.set(uri.path, diagnostics)
      }
    }
    diagnosticMap.forEach((diagnosticList, uriObj) => {
      const curDiagnosticCollection: vscode.DiagnosticCollection =
        vscode.languages.createDiagnosticCollection()
      curDiagnosticCollection.set(Uri.parse(uriObj), diagnosticList)
      this.diagnosticCollection.push(curDiagnosticCollection)
    })
  }

  private getResourceError(str: string): ResourceError {
    try {
      const jsonContent: ResourceError = JSON.parse(str)
      return jsonContent
    } catch (e) {
      console.error("Couldn't read the error logs. Please contact Certora team")
      const resource_error: ResourceError = {
        topics: [],
      }
      return resource_error
    }
  }

  private async relativeToFullPath(uri: Uri): Promise<Uri> {
    const pathAsArray = uri.path.split('/')
    const fileName = pathAsArray[pathAsArray.length - 1]
    const ignoreFolderRegex =
      '{**/certora-logs,**/conf,**/.github,cache,**/.last_confs,**/.certora_config,**/images}'
    const fullPath = await vscode.workspace.findFiles(
      '**' + fileName,
      ignoreFolderRegex,
      1,
    )
    if (!fullPath || !fullPath[0]) {
      return uri
    }
    return fullPath[0]
  }

  private getPosition(
    location: RegExpExecArray | null,
    path: string,
    confFilePath: string,
    ts: number,
  ): Position {
    const confFileUri = this.getConfFileUri(confFilePath, ts)
    if (confFileUri && !(path === confFileUri.path) && location) {
      // Position object assumes the indexes given to it are starting with 0 while vscode code lines indexes are starting with 1.
      const [row, col] = location[0].split(':').filter(element => {
        return element !== ''
      })
      const rowPosition = parseInt(row) - 1
      const colPosition = parseInt(col) - 1
      return new Position(rowPosition, colPosition)
    }
    return new Position(0, 0)
  }

  /**
   * Returns a path to the file where the problem originated from. If the function did not get a file path in [path],
   * the function returns a path to the .conf file of the current run.
   * @param path RegExpExecArray contains a path to the file, as was received from the resource_file.json message
   * @param confFile path to a .conf file of the certora IDE, of the current run.
   * @returns a path to the file where the problem originated from, or a path to the .conf file
   */
  private async getPathToProblem(
    path: RegExpExecArray | null,
    confFile: string,
    ts: number,
  ): Promise<Uri> {
    const logFilePath = this.getConfFileUri(confFile, ts)
    if (!logFilePath) {
      return Uri.parse('')
    }

    let pathToReturn = logFilePath

    if (path && path[0]) {
      const fileUri = Uri.parse(path[0])

      // vscode API way to check if a file exists
      try {
        const fullPathUri = await this.relativeToFullPath(fileUri)
        await workspace.fs.readFile(fullPathUri)
        pathToReturn = fullPathUri
      } catch (e) {}
    }
    return pathToReturn
  }
}
