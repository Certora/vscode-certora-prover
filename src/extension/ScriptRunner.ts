import { workspace, window, Uri } from 'vscode'
import { spawn, exec, ChildProcessWithoutNullStreams } from 'child_process'
import * as os from 'os'
import { ScriptProgressLongPolling } from './ScriptProgressLongPolling'
import { ResultsWebviewProvider } from './ResultsWebviewProvider'
import { getProgressUrl } from './utils/getProgressUrl'
import type { Job } from './types'
import { PostProblemsInstance } from './PostProblems'

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

  constructor(resultsWebviewProvider: ResultsWebviewProvider) {
    this.polling = new ScriptProgressLongPolling()
    this.resultsWebviewProvider = resultsWebviewProvider

    // TODO: Find better solution
    this.resultsWebviewProvider.stopScript = this.stop
  }

  private getConfFileName(path: string): string {
    const splittedPathToConfFile = path.split('/')
    return splittedPathToConfFile[splittedPathToConfFile.length - 1]
  }

  /**
   * returns a uri of the conf.log file if the workspace path exists, null otherwise
   * @param pathToConfFile path to the .conf file (relative)
   * @param ts the time the file was created
   * @returns the full path to the conf.log file or null
   */
  private getLogFilePath(pathToConfFile: string, ts: number) {
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
    const logFilePath = this.getLogFilePath(pathToConfFile, ts)
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
    PostProblemsInstance.resetDiagnosticCollection()

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
          PostProblemsInstance.postProblems(confFile, ts)
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
}
