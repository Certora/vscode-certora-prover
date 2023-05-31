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
import fetch from 'node-fetch'
import * as os from 'os'
import { getInternalDirPath } from './utils/getRunInternalInfo'

export let cliVersion = 1

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
  private cliVersion = ''
  private errorMsg = ''

  constructor(resultsWebviewProvider: ResultsWebviewProvider) {
    this.resultsWebviewProvider = resultsWebviewProvider
    this.resultsWebviewProvider.stopScript = this.stop
    this.polling = new ScriptProgressLongPolling(this.resultsWebviewProvider)
  }

  private getConfFileName(path: string): string {
    const splittedPathToConfFile = path.split('/')
    return splittedPathToConfFile[splittedPathToConfFile.length - 1]
  }

  private getUrlReg(): RegExp {
    const pattern =
      'https://(prover|vaas-stg).certora.com/output/[a-zA-Z0-9/?=]+'
    return new RegExp(pattern)
  }

  private async getLogFilePath(pathToConfFile: string, ts: number) {
    let path = await getInternalDirPath()
    if (path) {
      const logFilePath = Uri.joinPath(
        path,
        `${this.getConfFileName(pathToConfFile)}.log`,
      )
      return logFilePath
    }
    // if we can't find the relevant directory in [CERTORA_INNER_DIR] --> create log file in another directory named [LOG_DIRECTORY_DEFAULT] inside it. in this case we need timestamps to be not run over older log files
    path = workspace.workspaceFolders?.[0]?.uri
    if (!path) return
    const logFilePath = Uri.joinPath(
      path,
      CERTORA_INNER_DIR,
      LOG_DIRECTORY_DEFAULT,
      `${this.getConfFileName(pathToConfFile)}-${ts}.log`,
    )

    try {
      // check if file curLog exists
      await workspace.fs.stat(logFilePath)
    } catch (e) {
      return
    }
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

  public async buildSh(shFile: string): Promise<boolean> {
    const path = workspace.workspaceFolders?.[0]
    if (!path) {
      await window.showErrorMessage(
        'Failed to build ' +
          this.getConfFileName(shFile) +
          ' into a configuration file',
      )
      return false
    }
    const shScript = spawn(`sh`, [shFile], {
      cwd: path.uri.fsPath,
    })
    if (!shScript) {
      await window.showErrorMessage(
        'Failed to build ' +
          this.getConfFileName(shFile) +
          ' into a configuration file',
      )
      return false
    }
    shScript.stderr.on('data', async (data: any) => {
      const str = data.toString() as string
      if (str) {
        await window.showErrorMessage(
          'Failed to build ' +
            this.getConfFileName(shFile) +
            ' into a configuration file: ' +
            str,
        )
      }
      return false
    })
    return true
  }

  /**
   * get the job id from the link to the verification report
   * @param link link to the verification report (string)
   * @returns job id (string)
   */
  private getJobId(link: string): string {
    const regExp = this.getUrlReg()
    return link.split('?anonymousKey')[0].replace(regExp, '').split('/')[1]
  }

  /**
   * return the cvl version number
   * @param str
   */
  private whichVersion(str: string): number {
    if (str.includes('certora-cli-')) return 2
    const versionReg = /certora-cli 4.*/i
    if (versionReg.exec(str)) return 2
    return 1
  }

  /**
   * check the cli-version
   * @param confFile path to conf file (string)
   * @returns true if cli version is found, false otherwise
   */
  private checkCliVersion(confFile: string) {
    const versionScript = spawn(`certoraRun`, ['--version'], {
      cwd: workspace.workspaceFolders?.[0].uri.fsPath,
    })

    const { pid } = versionScript

    versionScript.stdout.on('data', async data => {
      const str = data.toString() as string
      this.cliVersion = str
      cliVersion = this.whichVersion(str)
    })

    versionScript.on('error', async err => {
      console.log(err)
      this.resultsWebviewProvider.postMessage({
        type: 'parse-error',
        payload: {
          confFile: this.getConfFileName(confFile).replace('.conf', ''),
          logFile: '',
        },
      })
      await window.showErrorMessage(
        `Command not found: certoraRun. Please make sure certora cli is installed.`,
      )
    })
    if (pid) return true
    return false
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
    if (!this.checkCliVersion(confFile)) return

    const ts = Date.now()
    const channel = window.createOutputChannel(
      `Certora IDE - ${confFile}-${ts}`,
    )
    this.script = spawn(
      `certoraRun`,
      ['--run_source', 'VSCODE', '--send_only', confFile],
      {
        cwd: path.uri.fsPath,
      },
    )

    if (!this.script) return

    this.errorMsg = ''

    const { pid } = this.script
    this.addRunningScript(confFile, pid)

    this.script.stdout.on('data', async data => {
      let str = data.toString() as string
      // remove all the bash color characters
      str = str.replace(re, '')
      this.log(str, confFile, ts)
      // parse errors are shown in an error message.
      if (str.includes('CRITICAL')) {
        await this.errorMsgWithLogAction(str, confFile, ts)
      }
      channel.appendLine(str)

      // look for url in the logs for cli version 1
      const regExp = this.getUrlReg()
      const curLink = regExp.exec(str)
      if (curLink) {
        this.runningScripts = this.runningScripts.map(rs => {
          if (rs.pid === pid) {
            rs.vrLink = curLink[0]
          }
          return rs
        })
      }
    })

    // when there was an error that prevented the prover from running
    this.script.on('error', async err => {
      // my internal log
      console.log(err)
      this.removeRunningScript(pid)
      this.resultsWebviewProvider.postMessage({
        type: 'parse-error',
        payload: {
          confFile: this.getConfFileName(confFile).replace('.conf', ''),
          logFile: '',
        },
      })
      await window.showErrorMessage(
        'Job failed before running certora-cli.\n CERTORA-CLI VERSION:',
        this.cliVersion,
      )
    })

    // create error message if needed
    this.script.stderr.on('data', async (data: any) => {
      const str = data.toString() as string
      if (str) {
        this.errorMsg += str
      }
    })

    this.script.on('close', async code => {
      let vrLink = ''
      if (cliVersion === 1) {
        const curRunningScript = this.runningScripts.find(rs => {
          return rs.pid === pid
        })
        if (curRunningScript?.vrLink) {
          vrLink = curRunningScript.vrLink
        }
      } else if (cliVersion === 2) {
        const innerLinkFiles = await workspace.findFiles(
          '**/*{.vscode_extension_info.json}',
          '{.certora_config,.git,emv-*,**/emv-*,**/*.certora_config,**/*.certora_sources}/**',
        )

        if (innerLinkFiles?.length) {
          const sortedFiles = innerLinkFiles.sort((uri1, uri2) => {
            return uri1.path > uri2.path ? -1 : 1
          })
          const lastFileByDate = sortedFiles[0]
          const decoder = new TextDecoder()
          const jsonContent = JSON.parse(
            decoder.decode(await workspace.fs.readFile(lastFileByDate)),
          )
          vrLink = jsonContent.verification_report_url
          if (vrLink) {
            this.runningScripts = this.runningScripts.map(rs => {
              if (rs.pid === pid) {
                rs.vrLink = vrLink
                rs.jobId = this.getJobId(vrLink)
                rs.uploaded = true
              }
              return rs
            })
          }
        }
      }

      const progressUrl = getProgressUrl(vrLink)

      const confFileName = this.getConfFileName(confFile).replace('.conf', '')

      if (progressUrl) {
        await this.saveLastResults(path.uri, confFile, {
          progressUrl: progressUrl,
          jobId: '',
          jobStatus: '',
          jobEnded: false,
          cloudErrorMessages: [],
          verificationProgress: {
            spec: '',
            contract: '',
            rules: [],
            timestamp: 0,
          },
          creationTime: '',
        })
        await this.polling.run(progressUrl, confFileName, async data => {
          data.pid = pid
          data.runName = confFileName
          await this.saveLastResults(path.uri, confFile, data)
          this.runningScripts.forEach(rs => {
            if (rs && rs.pid === pid && rs.vrLink) {
              data.verificationReportLink = rs.vrLink
              this.resultsWebviewProvider.postMessage<Job>({
                type: 'receive-new-job-result',
                payload: data,
              })
            }
          })
        })
      }

      this.resultsWebviewProvider.postMessage<{ pid: number; vrLink: string }>({
        type: 'run-next',
        payload: { pid: pid, vrLink: vrLink },
      })
      if (code === 1) {
        this.removeRunningScript(pid)
        // when there is a parse error, post it to PROBLEMS and send 'parse-error' to results
        PostProblems.postProblems(confFile)

        const curLog = await this.getLogFilePath(confFile, ts)
        this.resultsWebviewProvider.postMessage({
          type: 'parse-error',
          payload: {
            confFile: this.getConfFileName(confFile).replace('.conf', ''),
            logFile: curLog?.path || '',
          },
        })
        await window.showErrorMessage(
          `Job ended with exit code ${code}. \n${
            this.errorMsg.length > 300
              ? `ERROR: ${this.errorMsg.slice(0, 300)}...`
              : this.errorMsg
              ? `ERROR: ${this.errorMsg}`
              : ''
          } CERTORA-CLI VERSION: ${this.cliVersion}`,
        )
      }
    })
  }

  /**
   * saves the results of the last run of a job to the certora internal directory
   * @param path Uri path to workspace directory
   * @param confFile path to conf file
   * @param data data of a job to save
   */
  private async saveLastResults(
    path: Uri,
    confFile: string,
    data: Job,
  ): Promise<void> {
    try {
      const targetUri: Uri = Uri.parse(
        path.path +
          CERTORA_INNER_DIR +
          'last_results/' +
          this.getConfFileName(confFile).replace('.conf', '') +
          '.json',
      )
      const content = {
        confFile: path.path + confFile,
        data: JSON.parse(JSON.stringify(data)),
      }
      content.data.jobEnded = true
      const encoder = new TextEncoder()
      const encodedContent = encoder.encode(JSON.stringify(content))
      await workspace.fs.writeFile(targetUri, encodedContent)
    } catch (e) {
      console.log('[INNER ERROR]', e)
    }
  }

  /**
   * show informative message with link to the log file
   * @param strMsg message
   * @param confFile link to conf file (string)
   * @param ts timestamp (number)
   */
  private async errorMsgWithLogAction(
    strMsg: string,
    confFile: string,
    ts: number,
  ) {
    const maxLength = 500
    const action = await window.showErrorMessage(
      strMsg.length > maxLength ? strMsg.slice(0, maxLength) + '...' : strMsg,
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

  private stopUploadedScript(scriptToStop: RunningScript) {
    try {
      const certoraKey = process.env.CERTORAKEY?.toString() || ''

      const myHeaders = {
        Cookie: 'certoraKey=' + certoraKey,
      }

      const requestOptions: any = {
        method: 'POST',
        headers: myHeaders,
        body: JSON.stringify({
          certoraKey: certoraKey,
        }),
        redirect: 'follow',
      }

      fetch(
        scriptToStop.vrLink?.split('/output/')[0] +
          '/cancel/' +
          scriptToStop.jobId,
        requestOptions,
      )
        .then(response => response.text())
        .then(result => console.log(result))
        .catch(error => console.log('error', error))
    } catch (e) {
      console.log(e, '[INNER ERROR FROM API CALL]')
    }
  }

  /**
   * modal that asks the user if they are sure they want to stop a running script
   * @param name string name of the script
   * @returns boolean according to answer
   */
  private async askToStopJob(name: string): Promise<boolean> {
    const stopAction = `Stop '${name}'`
    const result = await window
      .showInformationMessage(
        `Are you sure you want to stop '${name}' from running?`,
        {
          modal: true,
        },
        stopAction,
      )
      .then(items => {
        if (items === stopAction) {
          return true
        } else {
          return false
        }
      })
    return result
  }

  public stop = async (pid: number, modal: boolean): Promise<void> => {
    const scriptToStop = this.runningScripts.find(rs => {
      return rs.pid === pid
    })
    if (scriptToStop === undefined) return

    let doStop = true
    if (modal) {
      doStop = await this.askToStopJob(
        this.getConfFileName(scriptToStop.confFile),
      )
    }
    if (!doStop) return

    if (scriptToStop.jobId !== undefined && scriptToStop.vrLink !== undefined) {
      this.stopUploadedScript(scriptToStop)
    } else if (!scriptToStop.uploaded) {
      const command =
        os.platform() === 'win32'
          ? `taskkill -F -T -PID ${pid}`
          : `kill -15 ${pid}`

      exec(command)
    }
    this.resultsWebviewProvider.postMessage({
      type: 'script-stopped',
      payload: pid,
    })
    this.removeRunningScript(pid)
  }

  private async addRunningScript(confFile: string, pid: number): Promise<void> {
    this.runningScripts.push({
      confFile,
      pid,
      uploaded: false,
    })
    this.sendRunningScriptsToWebview()
  }

  public renameRunningScript(oldConf: string, newConf: string): void {
    this.runningScripts = this.runningScripts.map(rs => {
      if (rs.confFile.includes(oldConf) || oldConf.includes(rs.confFile)) {
        rs.confFile = newConf
      }
      return rs
    })
    this.sendRunningScriptsToWebview()
  }

  // filter log files by name
  private filterLogFiles(name: string): void {
    this.logFiles = this.logFiles.filter(lf => {
      return lf.path.split('/').pop()?.replace('.conf', '')[0] !== name
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
