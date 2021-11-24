import * as vscode from 'vscode'
import { navigateToCode } from './utils/navigateToCode'
import { getNonce } from './utils/getNonce'

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
          default:
            break
        }
      },
      null,
      [],
    )
  }

  public postMessage<T>(message: { type: string; payload: T }): void {
    if (!this._panel) return
    this._panel.postMessage(message)
  }

  private _getHtmlForWebview(webview: vscode.Webview) {
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
        <script type="module" nonce="${nonce}" src="${toolkitUri}"></script>
        <link href="${styleUri}" rel="stylesheet">
        <link href="${codiconsUri}" rel="stylesheet">
      </head>
      <body>
        <script nonce="${nonce}">
          const vscode = acquireVsCodeApi();
        </script>
        <script nonce="${nonce}">
          const mediaPath = '${mediaPath}';
        </script>
        <script nonce="${nonce}" src="${scriptUri}"></script>
      </body>
    </html>`
  }
}
