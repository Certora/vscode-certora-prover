/* ---------------------------------------------------------------------------------------------
 *  Runs certoraRun command with the contant of a conf file.
 *-------------------------------------------------------------------------------------------- */
import { workspace, window, Uri } from 'vscode'
import { spawn, exec, ChildProcessWithoutNullStreams } from 'child_process'
import * as os from 'os'
import { ScriptProgressLongPolling } from './ScriptProgressLongPolling'
import { ResultsWebviewProvider } from './ResultsWebviewProvider'
import { getProgressUrl } from './utils/getProgressUrl'
import type { Job } from './types'
import { PostProblems } from './PostProblems'

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
  private logFile: Uri | undefined

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
    this.logFile = logFilePath
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

  /**
   * runs certoraRun command with the content of the [confFile]
   * @param confFile path to conf file
   * @returns void
   */
  public run(confFile: string): void {
    PostProblems.resetDiagnosticCollection()

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
      this.script.stdout.on('data', async data => {
        let str = data.toString() as string
        // remove all the bash color characters
        str = str.replace(re, '')
        this.log(str, confFile, ts)
        // parse errors are shown in an error message.
        if (str.includes('CRITICAL')) {
          // remove irrelevant --debug suggestion
          const shortMsg = str.split('consider running the script again')[0]
          window.showErrorMessage(shortMsg)
        }
        channel.appendLine(str)

        const progressUrl = getProgressUrl(str)

        const confFileName = confFile.replace('conf/', '').replace('.conf', '')

        if (progressUrl) {
          await this.polling.run(progressUrl, data => {
            data.runName = confFileName
            if (this.logFile) {
              workspace.fs.readFile(this.logFile).then(content => {
                const decoder = new TextDecoder()
                const strContent: string = decoder.decode(content)
                const pattern =
                  'https://prover.certora.com/output/[a-zA-Z0-9/?=]+'
                const vrLinkRegExp = new RegExp(pattern)
                const vrLink = vrLinkRegExp.exec(strContent)
                if (vrLink) {
                  data.verificationReportLink = (vrLink[0] as string) || ''
                  this.resultsWebviewProvider.postMessage<Job>({
                    type: 'receive-new-job-result',
                    payload: data,
                  })
                }
              })
            }
          })
        }
      })

      this.script.stderr.on('data', () => {
        this.removeRunningScript(pid)
      })

      this.script.on('error', err => {
        console.log(err, 'error message')
        this.removeRunningScript(pid)
      })

      this.script.on('close', async code => {
        this.removeRunningScript(pid)

        if (code !== 0) {
          // when there is a parse error, post it to PROBLEMS and send 'parse-error' to results
          PostProblems.postProblems(confFile)
          this.resultsWebviewProvider.postMessage({
            type: 'parse-error',
            payload: this.getConfFileName(confFile).replace('.conf', ''),
          })
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
