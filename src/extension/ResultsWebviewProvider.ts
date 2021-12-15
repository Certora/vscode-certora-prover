import * as vscode from 'vscode'
import axios from 'axios'
import { navigateToCode } from './utils/navigateToCode'
import { getNonce } from './utils/getNonce'
import { Output } from './types'

export class ResultsWebviewProvider implements vscode.WebviewViewProvider {
  public viewType = 'results'
  private _panel: vscode.Webview | null = null
  public stopScript: null | ((pid: number) => void) = null

  constructor(
    private readonly _extensionUri: vscode.Uri,
    private readonly runScript: () => Promise<void>,
    private readonly openSettings: () => void,
  ) {
    this._extensionUri = _extensionUri
    this.runScript = runScript
    this.openSettings = openSettings
  }

  resolveWebviewView({ webview }: vscode.WebviewView): void {
    this._panel = webview
    webview.options = {
      enableScripts: true,
      localResourceRoots: [this._extensionUri],
    }

    webview.html = this._getHtmlForWebview(webview)
    webview.onDidReceiveMessage(
      e => {
        switch (e.command) {
          case 'navigate-to-code':
            navigateToCode(e.payload)
            break
          case 'stop-script': {
            // this.stopScript is set in ScriptRunner.ts constructor
            if (typeof this.stopScript === 'function') {
              this.stopScript(e.payload)
            }
            break
          }
          case 'run-script':
            this.runScript()
            break
          case 'open-settings':
            this.openSettings()
            break
          case 'get-output':
            this.getOutput(e.payload)
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
    this._panel.postMessage(message)
  }

  private async getOutput(outputUrl: string): Promise<void> {
    try {
      const { data } = await axios.get<Output>(outputUrl)

      this.postMessage<Output>({ type: 'set-output', payload: data })
    } catch (e) {
      vscode.window.showErrorMessage(
        `Certora verification service is currently unavailable. Please, try again later.`,
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
        <meta http-equiv="Content-Security-Policy" content="default-src 'none'; style-src ${webview.cspSource}; font-src ${webview.cspSource}; img-src ${webview.cspSource}; script-src 'nonce-${nonce}';">
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
