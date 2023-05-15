/* ---------------------------------------------------------------------------------------------
 *  Results webview actions. When there is an action that has to do with sending
 *  information from the Results part of the application to the extension part,
 *  it is listened to in here, than the corresponding function is called.
 *-------------------------------------------------------------------------------------------- */

import * as vscode from 'vscode'
import axios from 'axios'
import { navigateToCode } from './utils/navigateToCode'
import { getNonce } from './utils/getNonce'
import { log, Sources } from './utils/log'
import {
  Output,
  CommandFromResultsWebview,
  EventFromResultsWebview,
  JobNameMap,
} from './types'

export class ResultsWebviewProvider implements vscode.WebviewViewProvider {
  public viewType = 'results'
  private _panel: vscode.Webview | null = null
  public stopScript: null | ((pid: number, modal: boolean) => void) = null
  public editConfFile: null | ((name: JobNameMap) => Promise<void>) = null
  public rename:
    | null
    | ((oldName: JobNameMap, newName: JobNameMap) => Promise<void>) = null

  public openSettings: null | ((name: JobNameMap) => void) = null
  public deleteConf: null | ((name: JobNameMap) => void) = null
  public askToDeleteJob: null | ((name: JobNameMap) => void) = null
  public createInitialJobs: null | (() => Promise<void>) = null
  public uploadConf: null | (() => Promise<void>) = null
  public duplicate:
    | null
    | ((
        toDuplicate: JobNameMap,
        duplicated: JobNameMap,
        rule?: string,
      ) => void) = null

  public runScript: null | ((name: JobNameMap) => void) = null
  public openLogFile: null | ((logFile: string) => Promise<void>) = null
  public enableEdit: null | ((name: JobNameMap) => void) = null
  public removeScript: null | ((name: string) => void) = null
  public clearResults: null | ((name: string) => void) = null

  constructor(private readonly _extensionUri: vscode.Uri) {
    this._extensionUri = _extensionUri
  }

  resolveWebviewView({ webview }: vscode.WebviewView): void {
    this._panel = webview
    webview.options = {
      enableScripts: true,
      localResourceRoots: [this._extensionUri],
    }

    webview.html = this._getHtmlForWebview(webview)
    webview.onDidReceiveMessage(
      (e: EventFromResultsWebview) => {
        switch (e.command) {
          case CommandFromResultsWebview.InitResults:
            log({
              action: 'Received "init-results" command',
              source: Sources.Extension,
            })
            if (typeof this.createInitialJobs === 'function') {
              this.createInitialJobs()
            }
            break
          case CommandFromResultsWebview.OpenLogFile:
            log({
              action: 'Received "open-log-file" command',
              source: Sources.Extension,
              info: e.payload,
            })
            if (typeof this.openLogFile === 'function') {
              this.openLogFile(e.payload)
            }
            break
          case CommandFromResultsWebview.ClearResults:
            log({
              action: 'Received "clear-results" command',
              source: Sources.Extension,
            })
            if (typeof this.clearResults === 'function') {
              this.clearResults(e.payload)
            }
            break
          case CommandFromResultsWebview.NavigateToCode:
            log({
              action: 'Received "navigate-to-code" command',
              source: Sources.Extension,
              info: e.payload,
            })
            navigateToCode(e.payload)
            break
          case CommandFromResultsWebview.StopScript:
            log({
              action: 'Received "stop-script" command',
              source: Sources.Extension,
              info: e.payload,
            })
            // this.stopScript is set in ScriptRunner.ts constructor
            if (typeof this.stopScript === 'function') {
              this.stopScript(e.payload.pid, e.payload.modal)
            }
            break
          case CommandFromResultsWebview.RunScript:
            log({
              action: 'Received "run-script" command',
              source: Sources.Extension,
              info: e.payload,
            })
            if (typeof this.runScript === 'function') {
              this.runScript(e.payload)
            }
            break
          case CommandFromResultsWebview.Rename:
            log({
              action: 'Received "rename" command',
              source: Sources.Extension,
              info: e.payload,
            })
            if (typeof this.rename === 'function') {
              this.rename(e.payload.oldName, e.payload.newName)
            }
            break
          case CommandFromResultsWebview.OpenSettings:
            log({
              action: 'Received "open-settings" command',
              source: Sources.Extension,
            })
            if (typeof this.openSettings === 'function') {
              this.openSettings(e.payload)
            }
            break
          case CommandFromResultsWebview.EditConfFile:
            log({
              action: 'Received "edit-confFile" command',
              source: Sources.Extension,
            })
            if (typeof this.editConfFile === 'function') {
              this.editConfFile(e.payload)
            }
            break
          case CommandFromResultsWebview.GetOutput:
            log({
              action: 'Received "get-output" command',
              source: Sources.Extension,
              info: e.payload,
            })
            this.getOutput(e.payload)
            break
          case CommandFromResultsWebview.DeleteConfFile:
            log({
              action: 'Received "delete-confFile" command',
              source: Sources.Extension,
              info: e.payload,
            })
            if (typeof this.deleteConf === 'function') {
              this.deleteConf(e.payload)
            }
            break
          case CommandFromResultsWebview.AskToDeleteJob:
            log({
              action: 'Received "ask-to-delete-job" command',
              source: Sources.Extension,
              info: e.payload,
            })
            if (typeof this.askToDeleteJob === 'function') {
              this.askToDeleteJob(e.payload)
            }
            break
          case CommandFromResultsWebview.Duplicate:
            log({
              action: 'Received "duplicate" command',
              source: Sources.Extension,
              info: e.payload,
            })
            if (typeof this.duplicate === 'function') {
              this.duplicate(
                e.payload.toDuplicate,
                e.payload.duplicatedName,
                e.payload.rule,
              )
            }
            break
          case CommandFromResultsWebview.RemoveScript:
            log({
              action: 'Received "remove-script" command',
              source: Sources.Extension,
              info: e.payload,
            })
            if (typeof this.removeScript === 'function') {
              this.removeScript(e.payload)
            }
            break
          case CommandFromResultsWebview.UploadConf:
            log({
              action: 'Received "upload-conf" command',
              source: Sources.Extension,
            })
            if (typeof this.uploadConf === 'function') {
              this.uploadConf()
            }
            break
          case CommandFromResultsWebview.EnableEdit:
            log({
              action: 'Received "enable-edit" command',
              source: Sources.Extension,
              info: e.payload,
            })
            if (typeof this.enableEdit === 'function') {
              this.enableEdit(e.payload)
            }
            break
          default:
            break
        }
      },
      null,
      [],
    )
  }

  public postMessage<T>(message: { type: string; payload?: T }): void {
    if (!this._panel) return

    log({
      action: `Send "${message.type}" command`,
      source: Sources.Extension,
      info: message.payload,
    })
    this._panel.postMessage(message)
  }

  private async getOutput(outputUrl: string): Promise<void> {
    try {
      const { data } = await axios.get<Output>(outputUrl)

      log({
        action: 'Send "set-output" command',
        source: Sources.Extension,
        info: data,
      })
      this.postMessage<Output>({ type: 'set-output', payload: data })
    } catch (e) {
      vscode.window.showErrorMessage(
        `Certora verification service is currently unavailable. Please, try again later. ${e}`,
      )
    }
  }

  private _getHtmlForWebview(webview: vscode.Webview) {
    const path = vscode.workspace.workspaceFolders?.[0]

    if (!path) {
      return /* html */ `<!DOCTYPE html>
      <html>
        <head>
          <meta charset="UTF-8">
          <meta http-equiv="Content-Security-Policy" content="default-src 'none'; style-src ${webview.cspSource};">          
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
        </head>
        <body>
          <p>You don't have any opened projects yet.</p>
          <p>Open the project to use the extension.</p>
        </body>
      </html>`
    }

    const scriptUri = webview.asWebviewUri(
      vscode.Uri.joinPath(this._extensionUri, 'out', 'results', 'bundle.js'),
    )
    const styleUri = webview.asWebviewUri(
      vscode.Uri.joinPath(this._extensionUri, 'out', 'results', 'bundle.css'),
    )
    const codiconsUri = webview.asWebviewUri(
      vscode.Uri.joinPath(
        this._extensionUri,
        'node_modules',
        '@vscode',
        'codicons',
        'dist',
        'codicon.css',
      ),
    )
    const toolkitUri = webview.asWebviewUri(
      vscode.Uri.joinPath(
        this._extensionUri,
        'node_modules',
        '@vscode',
        'webview-ui-toolkit',
        'dist',
        'toolkit.js',
      ),
    )

    const nonce = getNonce()
    const mediaPath = webview.asWebviewUri(
      vscode.Uri.joinPath(this._extensionUri, 'media'),
    )

    return /* html */ `<!DOCTYPE html>
    <html>
      <head>
        <meta charset="UTF-8">
        <meta http-equiv="Content-Security-Policy" content="default-src 'none'; style-src ${webview.cspSource} 'unsafe-inline'; font-src ${webview.cspSource}; img-src ${webview.cspSource}; script-src 'nonce-${nonce}';">        
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <meta data-media-path="${mediaPath}">
        <script type="module" nonce="${nonce}" src="${toolkitUri}"></script>
        <link href="${styleUri}" rel="stylesheet">
        <link href="${codiconsUri}" rel="stylesheet">
      </head>
      <body>
        <script nonce="${nonce}">
          const vscode = acquireVsCodeApi();
        </script>
        <script nonce="${nonce}" src="${scriptUri}"></script>
      </body>
    </html>`
  }
}
