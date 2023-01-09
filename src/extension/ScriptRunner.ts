/* ---------------------------------------------------------------------------------------------
 *  Runs certoraRun command with the content of a conf file.
 *-------------------------------------------------------------------------------------------- */
import { workspace, window, Uri } from 'vscode'
import { spawn, exec, ChildProcessWithoutNullStreams } from 'child_process'
import { ScriptProgressLongPolling } from './ScriptProgressLongPolling'
import { ResultsWebviewProvider } from './ResultsWebviewProvider'
import { getProgressUrl } from './utils/getProgressUrl'
import { Job, CERTORA_INNER_DIR, LOG_DIRECTORY_DEFAULT } from './types'
import { PostProblems } from './PostProblems'
import { checkDir } from './utils/checkDir'
import fetch from 'node-fetch'
import * as os from 'os'

type RunningScript = {
  pid: number
  confFile: string
  uploaded: boolean
  jobId?: string
  vrLink?: string
}

const re = /(\033)|(\[33m)|(\[32m)|(\[31m)|(\[0m)/g

export class ScriptRunner {
  private readonly polling: ScriptProgressLongPolling
  private readonly resultsWebviewProvider: ResultsWebviewProvider
  private script: ChildProcessWithoutNullStreams | null = null
  private runningScripts: RunningScript[] = []
  private logFiles: Uri[] = []

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
   * returns a Date if possible, null if not possible
   * @param dir string in the format of 22_12_05_14_22_09_BLA
   * @returns date object
   */
  private getDateFormat(dir: string): [Date, string] {
    const arr = dir.split('_').slice(0, 6)
    const dateStr = '20' + arr.slice(0, 3).join('-') + 'T'
    const timeStr = arr.slice(3, 6).join(':') + 'Z'
    const str = dateStr + timeStr
    return [new Date(str), dir]
  }

  /**
   * returns a uri of the conf.log file if the workspace path exists, null otherwise
   * @param pathToConfFile path to the .conf file (relative)
   * @param ts the time the file was created
   * @returns the full path to the conf.log file or null
   */
  private async getLogFilePath(pathToConfFile: string, ts: number) {
    const path = workspace.workspaceFolders?.[0]
    if (!path) return

    const internalUri = Uri.parse(path.uri.path + CERTORA_INNER_DIR)
    const checked = await checkDir(internalUri)
    if (checked) {
      const innerDirs = await workspace.fs.readDirectory(internalUri)
      const dates = innerDirs.map(dir => {
        if (dir[1] === 2) {
          return this.getDateFormat(dir[0])
        }
        return null
      })
      // filter out null values
      const datesNew = dates.filter(date => {
        return date && date[0]
      })

      // sort by date
      const sortedDates = datesNew.sort(function (a, b) {
        if (a !== null && b !== null) {
          return a[0] > b[0] ? -1 : 1
        }
        return 0
      })

      // get the most recent date / dir
      const curDate = sortedDates[0]

      if (curDate) {
        const logFilePath = Uri.joinPath(
          path.uri,
          CERTORA_INNER_DIR,
          curDate[1],
          `${this.getConfFileName(pathToConfFile)}.log`,
        )
        return logFilePath
      }
    }
    // if we can't find the relevant directory in [CERTORA_INNER_DIR] --> create log file in another directory named [LOG_DIRECTORY_DEFAULT] inside it. in this case we need timestamps to be not run over older log files
    const logFilePath = Uri.joinPath(
      path.uri,
      CERTORA_INNER_DIR,
      LOG_DIRECTORY_DEFAULT,
      `${this.getConfFileName(pathToConfFile)}-${ts}.log`,
    )
    return logFilePath
  }

  private async log(
    str: string,
    pathToConfFile: string,
    ts: number,
  ): Promise<void> {
    const logFilePath = await this.getLogFilePath(pathToConfFile, ts)
    if (!logFilePath) {
      return
    }
    if (this.logFiles.find(lf => lf.path === logFilePath.path) === undefined) {
      this.logFiles.push(logFilePath)
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

  private getRuleReportLink(str: string) {
    const pattern =
      'https://(prover|vaas-stg).certora.com/output/[a-zA-Z0-9/?=]+'
    const vrLinkRegExp = new RegExp(pattern)
    const vrLink = vrLinkRegExp.exec(str)
    return vrLink
  }

  /**
   * get the job id from the link to the verification report
   * @param link link to the verification report (string)
   * @returns job id (string)
   */
  private getJobId(link: string): string {
    const pattern = 'https://(prover|vaas-stg).certora.com/output/'
    const regExp = new RegExp(pattern)
    return link.split('?anonymousKey')[0].replace(regExp, '').split('/')[1]
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

    if (!this.script) return

    const { pid } = this.script
    this.addRunningScript(confFile, pid)

    this.script.stdout.on('data', async data => {
      let str = data.toString() as string
      // remove all the bash color characters
      str = str.replace(re, '')
      this.log(str, confFile, ts)
      // parse errors are shown in an error message.
      if (str.includes('CRITICAL')) {
        // remove irrelevant --debug suggestion
        const shortMsg = str.split('consider running the script again')[0]

        // the use of [action] is necessary to add the button that opens the log file
        const action = await window.showErrorMessage(
          shortMsg,
          'Open Execution Log File',
        )
        if (action === 'Open Execution Log File') {
          const logFilePath = await this.getLogFilePath(confFile, ts)
          if (logFilePath !== undefined) {
            try {
              const document = await workspace.openTextDocument(logFilePath)
              await window.showTextDocument(document)
            } catch (e) {
              console.log('ERROR: ', e, '[Internal error from extension]')
            }
          }
        }
      }
      const vrLink = this.getRuleReportLink(str)
      if (vrLink) {
        this.runningScripts = this.runningScripts.map(rs => {
          if (rs.pid === pid) {
            rs.vrLink = vrLink[0]
            rs.jobId = this.getJobId(vrLink[0])
          }
          return rs
        })
      }
      channel.appendLine(str)

      const progressUrl = getProgressUrl(str)

      const confFileName = this.getConfFileName(confFile).replace('.conf', '')

      if (progressUrl) {
        await this.polling.run(progressUrl, async data => {
          data.runName = confFileName
          this.runningScripts.forEach(rs => {
            if (rs.pid === pid && rs.vrLink) {
              data.verificationReportLink = rs.vrLink
              this.resultsWebviewProvider.postMessage<Job>({
                type: 'receive-new-job-result',
                payload: data,
              })
            }
          })
        })
      }
    })

    // this.script.stderr.on('data', async data => {
    //   // this.removeRunningScript(pid)
    // })

    this.script.on('error', async err => {
      console.error(err, 'this is an error from the script')
      this.removeRunningScript(pid)
    })

    this.script.on('close', async code => {
      let vrLink
      this.runningScripts = this.runningScripts.map(rs => {
        if (rs.pid === pid) {
          rs.uploaded = true
          vrLink = rs.vrLink
        }
        return rs
      })
      this.resultsWebviewProvider.postMessage<{ pid: number; vrLink: string }>({
        type: 'run-next',
        payload: { pid: pid, vrLink: vrLink !== undefined ? vrLink : '' },
      })
      if (code !== 0) {
        this.removeRunningScript(pid)
        // when there is a parse error, post it to PROBLEMS and send 'parse-error' to results
        PostProblems.postProblems(confFile)
        this.resultsWebviewProvider.postMessage({
          type: 'parse-error',
          payload: this.getConfFileName(confFile).replace('.conf', ''),
        })
      }
    })
  }

  // public stop = (pid: number): void => {
  //   const command =
  //     os.platform() === 'win32'
  //       ? `taskkill -F -T -PID ${pid}`
  //       : `kill -15 ${pid}`

  //   exec(command)
  //
  //   this.removeRunningScript(pid)
  //   this.resultsWebviewProvider.postMessage({
  //     type: 'script-stopped',
  //     payload: pid,
  //   })
  // }

  public stop = (pid: number): void => {
    this.runningScripts.forEach(async rs => {
      if (rs.vrLink !== undefined) {
        try {
          // send api request to the cloud
          // need to send certora key - need to solve this
          const data = await fetch(
            'https://prover.certora.com/cancel/' + rs.jobId,
            { method: 'GET' },
          )
          // console.log('data from fetch:', await data.json())
        } catch (e) {
          console.log(e, '[INNER ERROR FROM API CALL]')
        }
      } else {
        const command =
          os.platform() === 'win32'
            ? `taskkill -F -T -PID ${pid}`
            : `kill -15 ${pid}`

        exec(command)
      }
    })
    this.resultsWebviewProvider.postMessage({
      type: 'script-stopped',
      payload: pid,
    })
    this.removeRunningScript(pid)
  }

  private addRunningScript(confFile: string, pid: number): void {
    this.runningScripts.push({
      confFile,
      pid,
      uploaded: false,
    })
    this.sendRunningScriptsToWebview()
  }

  // filter log files by name
  private filterLogFiles(name: string): void {
    this.logFiles = this.logFiles.filter(lf => {
      return lf.path.split('/').reverse()[0].split('.conf')[0] !== name
    })
  }

  private removeRunningScript(pid: number): void {
    const confFile = this.runningScripts.find(rs => rs.pid === pid)
    this.runningScripts = this.runningScripts.filter(script => {
      return script.pid !== pid
    })
    const name = confFile?.confFile
    if (name) {
      this.filterLogFiles(name)
    }
    this.sendRunningScriptsToWebview()
  }

  public removeRunningScriptByName(name: string): void {
    this.runningScripts = this.runningScripts.filter(script => {
      return this.getConfFileName(script.confFile).replace('.conf', '') !== name
    })
    this.filterLogFiles(name)
    this.sendRunningScriptsToWebview()
  }

  private sendRunningScriptsToWebview(): void {
    this.resultsWebviewProvider.postMessage<RunningScript[]>({
      type: 'running-scripts-changed',
      payload: this.runningScripts,
    })
  }
}
