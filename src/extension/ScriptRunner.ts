import { workspace, window, Uri } from 'vscode'
import { spawn, exec, ChildProcessWithoutNullStreams } from 'child_process'
import * as os from 'os'
import { ScriptProgressLongPolling } from './ScriptProgressLongPolling'
import { ResultsWebviewProvider } from './ResultsWebviewProvider'
import { getProgressUrl } from './utils/getProgressUrl'
import type { Job } from './types'

type RunningScript = {
  pid: number
  confFile: string
}

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
    const splitedPathToConfFile = path.split('/')
    return splitedPathToConfFile[splitedPathToConfFile.length - 1]
  }

  private async log(
    str: string,
    pathToConfFile: string,
    ts: number,
  ): Promise<void> {
    const path = workspace.workspaceFolders?.[0]

    if (!path) return

    const logFilePath = Uri.joinPath(
      path.uri,
      'certora-logs',
      `${this.getConfFileName(pathToConfFile)}-${ts}.log`,
    )
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
    const path = workspace.workspaceFolders?.[0]

    if (!path) return

    const ts = Date.now()
    const channel = window.createOutputChannel(`${confFile}-${ts}`)
    this.script = spawn(`certoraRun`, [confFile], {
      cwd: path.uri.fsPath,
    })
    const { pid } = this.script
    this.addRunningScript(confFile, pid)

    if (this.script) {
      window
        .showInformationMessage(
          'The script with the configuration file has been launched',
          'Show The Script Output',
        )
        .then(action => {
          if (action === 'Show The Script Output') {
            channel.show()
          }
        })

      this.script.stdout.on('data', async data => {
        const str = data.toString() as string
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

        const action = await window.showInformationMessage(
          `The script for the config file ${confFile} exited with code ${code}.`,
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
        : `kill -SIGTERM ${pid}`

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
