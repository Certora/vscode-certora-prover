import * as vscode from 'vscode'

export class SettingsPanel {
  public static currentPanel?: SettingsPanel
  private readonly _panel: vscode.WebviewPanel
  private _disposables: vscode.Disposable[] = []

  private constructor(panel: vscode.WebviewPanel, extensionUri: vscode.Uri) {
    this._panel = panel

    this._panel.webview.html = this._getWebviewContent(
      this._panel.webview,
      extensionUri,
    )
    this._panel.onDidDispose(this.dispose, null, this._disposables)
  }

  public static render(extensionUri: vscode.Uri): void {
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
        },
      )

      SettingsPanel.currentPanel = new SettingsPanel(panel, extensionUri)
    }
  }

  private _getWebviewContent(
    webview: vscode.Webview,
    extensionUri: vscode.Uri,
  ): string {
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

    return /* html */ `
      <!DOCTYPE html>
      <html lang="en">
        <head>
          <meta charset="UTF-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <script type="module" src="${toolkitUri}"></script>
          <title>Certora IDE Settings</title>
        </head>
        <body>
        </body>
      </html>
    `
  }

  public dispose(): void {
    SettingsPanel.currentPanel = undefined
    this._panel.dispose()

    while (this._disposables.length) {
      const disposable = this._disposables.pop()

      if (disposable) disposable.dispose()
    }
  }
}
