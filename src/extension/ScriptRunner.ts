import { workspace, window } from 'vscode'
import { spawn, exec, ChildProcessWithoutNullStreams } from 'child_process'
import * as os from 'os'
import {
  ScriptProgressLongPolling,
  ProgressResponse,
} from './ScriptProgressLongPolling'
import { ResultsWebviewProvider } from './ResultsWebviewProvider'
import { getProgressUrl } from './utils/getProgressUrl'

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

  public run(confFile: string): void {
    const path = workspace.workspaceFolders?.[0]

    if (!path) return

    // this.channel = window.createOutputChannel(`certoraRun ${confFile}`)
    this.script = spawn(`certoraRun`, [confFile], {
      cwd: path.uri.fsPath,
    })
    const { pid } = this.script
    this.addRunningScript(confFile, pid)

    if (this.script) {
      this.script.stdout.on('data', async data => {
        const str = data.toString()

        const progressUrl = getProgressUrl(str)

        if (progressUrl) {
          await this.polling.run(progressUrl, data => {
            this.resultsWebviewProvider.postMessage<ProgressResponse>({
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

      this.script.on('close', code => {
        this.polling.stop()
        this.removeRunningScript(pid)
        window.showInformationMessage(
          `certoraRun script exited with code ${code}`,
        )
      })
    }
  }

  public stop = (pid: number): void => {
    if (os.platform() === 'win32') {
      exec(`taskkill -F -T -PID ${pid}`)
    } else {
      exec(`kill -9 ${pid}`)
    }
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
