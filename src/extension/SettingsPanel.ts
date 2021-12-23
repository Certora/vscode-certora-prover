import * as vscode from 'vscode'
import { SmartContractsFilesWatcher } from './SmartContractsFilesWatcher'
import { getNonce } from './utils/getNonce'
import { createAndOpenConfFile } from './utils/createAndOpenConfFile'
import { log, Sources } from './utils/log'
import { CommandFromSettingsWebview, EventFromSettingsWebview } from './types'

export class SettingsPanel {
  public static currentPanel?: SettingsPanel
  private readonly _panel: vscode.WebviewPanel
  private _disposables: vscode.Disposable[] = []
  private watcher: SmartContractsFilesWatcher

  private constructor(
    panel: vscode.WebviewPanel,
    extensionUri: vscode.Uri,
    editConfFile?: Record<string, unknown>,
  ) {
    this._panel = panel

    this._panel.webview.html = this._getWebviewContent(
      this._panel.webview,
      extensionUri,
    )

    this.watcher = new SmartContractsFilesWatcher()
    this.watcher.init(this._panel.webview)

    if (editConfFile) {
      this._panel.webview.postMessage({
        type: 'edit-conf-file',
        payload: editConfFile,
      })
    }

    this._panel.webview.onDidReceiveMessage(
      (e: EventFromSettingsWebview) => {
        switch (e.command) {
          case CommandFromSettingsWebview.SmartContractsFilesRefresh:
            log({
              action: 'Received "smart-contracts-files-refresh" command',
              source: Sources.Extension,
            })
            this.watcher.init(this._panel.webview)
            break
          case CommandFromSettingsWebview.CreateConfFile: {
            log({
              action: 'Received "create-conf-file" command',
              source: Sources.Extension,
              info: e.payload,
            })
            createAndOpenConfFile(e.payload)
            this._panel?.dispose()
            break
          }
          default:
            break
        }
      },
      null,
      [],
    )

    this._panel.onDidDispose(this.dispose, null, this._disposables)
  }

  public static render(
    extensionUri: vscode.Uri,
    editConfFile?: Record<string, unknown>,
  ): void {
    if (SettingsPanel.currentPanel) {
      SettingsPanel.currentPanel._panel.reveal(vscode.ViewColumn.One)
    } else {
      const panel = vscode.window.createWebviewPanel(
        'certoraSettings',
        'Certora IDE Settings',
        vscode.ViewColumn.One,
        {
          retainContextWhenHidden: true,
          enableScripts: true,
          localResourceRoots: [extensionUri],
        },
      )

      SettingsPanel.currentPanel = new SettingsPanel(
        panel,
        extensionUri,
        editConfFile,
      )
    }
  }

  private _getWebviewContent(
    webview: vscode.Webview,
    extensionUri: vscode.Uri,
  ): string {
    const scriptUri = webview.asWebviewUri(
      vscode.Uri.joinPath(extensionUri, 'out', 'settings', 'bundle.js'),
    )
    const styleUri = webview.asWebviewUri(
      vscode.Uri.joinPath(extensionUri, 'out', 'settings', 'bundle.css'),
    )
    const toolkitUri = webview.asWebviewUri(
      vscode.Uri.joinPath(
        extensionUri,
        'node_modules',
        '@vscode',
        'webview-ui-toolkit',
        'dist',
        'toolkit.js',
      ),
    )
    const codiconsUri = webview.asWebviewUri(
      vscode.Uri.joinPath(
        extensionUri,
        'node_modules',
        '@vscode',
        'codicons',
        'dist',
        'codicon.css',
      ),
    )

    const nonce = getNonce()
    const csp = `default-src 'none'; style-src ${webview.cspSource} 'unsafe-inline'; font-src ${webview.cspSource}; img-src ${webview.cspSource}; script-src 'nonce-${nonce}'; script-src-elem 'nonce-${nonce}';`

    return /* html */ `
      <!DOCTYPE html>
      <html lang="en">
        <head>
          <meta charset="UTF-8">
          <meta http-equiv="Content-Security-Policy" content="${csp}">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
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
      </html>
    `
  }

  public dispose(): void {
    SettingsPanel.currentPanel = undefined

    if (!this) return

    this._panel?.dispose()

    while (this._disposables.length) {
      const disposable = this._disposables.pop()

      if (disposable) disposable.dispose()
    }
  }
}
