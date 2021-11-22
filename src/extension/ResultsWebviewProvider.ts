import * as vscode from 'vscode'
import { navigateToCode, JumpToDefinition } from './utils/navigateToCode'
import { getNonce } from './utils/getNonce'

export enum Commands {
  NavigateToCode = 'navigate-to-code',
}

type EventFromWebview = {
  command: Commands.NavigateToCode
  payload: JumpToDefinition[]
}

export class ResultsWebviewProvider implements vscode.WebviewViewProvider {
  viewType = 'results'
  private _panel: vscode.Webview | null

  constructor(private readonly _extensionUri: vscode.Uri) {
    this._panel = null
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
      (e: EventFromWebview) => {
        switch (e.command) {
          case Commands.NavigateToCode:
            navigateToCode(e.payload)
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
