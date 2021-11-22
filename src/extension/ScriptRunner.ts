import { workspace, window, OutputChannel } from 'vscode'
import { spawn, ChildProcessWithoutNullStreams } from 'child_process'
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
  private channel: OutputChannel | null = null
  private script: ChildProcessWithoutNullStreams | null = null
  private runningScripts: RunningScript[] = []

  constructor(resultsWebviewProvider: ResultsWebviewProvider) {
    this.polling = new ScriptProgressLongPolling()
    this.resultsWebviewProvider = resultsWebviewProvider
    this.resultsWebviewProvider.stopScript = this.stop
  }

  public run(confFile: string): void {
    const path = workspace.workspaceFolders?.[0]

    if (!path) return

    this.channel = window.createOutputChannel(`certoraRun ${confFile}`)
    this.script = spawn(`certoraRun`, [confFile], {
      cwd: path.uri.fsPath,
    })
    const { pid } = this.script
    this.addRunningScript(confFile, pid)

    if (this.script) {
      this.script.stdout.on('data', async data => {
        const str = data.toString()
        if (this.channel) this.channel.appendLine(str)

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

        if (this.channel) {
          this.channel.clear()
          this.channel.dispose()
        }
      })
    }
  }

  public stop(): void {
    if (this.script) {
      this.removeRunningScript(this.script.pid)
      this.script.kill()
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
