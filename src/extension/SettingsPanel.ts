import * as vscode from 'vscode'
import { SmartContractsFilesWatcher } from './SmartContractsFilesWatcher'
import { getNonce } from './utils/getNonce'
import {
  createAndOpenConfFile,
  processForm,
} from './utils/createAndOpenConfFile'
import { log, Sources } from './utils/log'
import {
  CommandFromSettingsWebview,
  ConfNameMap,
  EventFromSettingsWebview,
  InputFormData,
} from './types'
import { ResultsWebviewProvider } from './ResultsWebviewProvider'

export class SettingsPanel {
  public static currentPanel?: SettingsPanel
  private readonly _panel: vscode.WebviewPanel
  private _disposables: vscode.Disposable[] = []
  private watcher: SmartContractsFilesWatcher
  private editConfFile?: Record<string, unknown>
  private static allPanels: SettingsPanel[] = []
  private curConfFileDisplayName: string
  private static resultsWebviewProvider: ResultsWebviewProvider

  private constructor(
    panel: vscode.WebviewPanel,
    extensionUri: vscode.Uri,
    confFileDisplayName: string,
    confFileName: string,
    editConfFile?: Record<string, unknown>,
  ) {
    this.curConfFileDisplayName = confFileDisplayName

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
        payload: [editConfFile, confFileName],
      })
      this.editConfFile = editConfFile
    }

    this._panel.onDidChangeViewState(e => {
      if (e.webviewPanel.visible) {
        if (SettingsPanel.resultsWebviewProvider) {
          SettingsPanel.resultsWebviewProvider.postMessage({
            type: 'focus-changed',
            payload: confFileName,
          })
        }
      }
    })

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
            if (!e.payload.checkMyInputs) {
              const form: InputFormData = processForm(e.payload, confFileName)
              createAndOpenConfFile(form)
              if (
                form.mainContractName &&
                form.mainSolidityFile &&
                form.solidityCompiler &&
                form.specFile
              ) {
                SettingsPanel.resultsWebviewProvider.postMessage({
                  type: 'allow-run',
                  payload: confFileName,
                })
              } else {
                SettingsPanel.resultsWebviewProvider.postMessage({
                  type: 'block-run',
                  payload: confFileName,
                })
              }
            } else {
              SettingsPanel.resultsWebviewProvider.postMessage({
                type: 'block-run',
                payload: confFileName,
              })
            }
            break
          }
          case CommandFromSettingsWebview.OpenBrowser: {
            log({
              action: 'Received "open-browser" command',
              source: Sources.Extension,
              info: e.payload,
            })
            this.openOsPicker(e.payload[0], e.payload[1])
            break
          }
          default:
            break
        }
      },
      null,
      [],
    )
    this._panel.onDidDispose(
      this.removeFromAllPanelsAndDispose,
      null,
      this._disposables,
    )
  }

  removeFromAllPanelsAndDispose = (): void => {
    SettingsPanel.allPanels = SettingsPanel.allPanels.filter(p => p !== this)
    if (SettingsPanel.allPanels.length === 0) {
      if (SettingsPanel.resultsWebviewProvider) {
        SettingsPanel.resultsWebviewProvider.postMessage({
          type: 'focus-changed',
          payload: '',
        })
      }
    }
    this.dispose()
  }

  /**
   * opens a new settings panel in a new tab
   * @param extensionUri uri of the extension folder
   * @param editConfFile conf file content
   */
  private static _openNewPanel(
    extensionUri: vscode.Uri,
    confFileName: ConfNameMap,
    editConfFile?: Record<string, unknown>,
  ) {
    console.log('create new panel!!!!!')
    const panel = vscode.window.createWebviewPanel(
      'certoraSettings',
      'Certora IDE Settings: ' + confFileName.displayName,
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
      confFileName.displayName,
      confFileName.fileName,
      editConfFile,
    )
    this.allPanels.push(SettingsPanel.currentPanel)
    if (SettingsPanel.resultsWebviewProvider) {
      SettingsPanel.resultsWebviewProvider.postMessage({
        type: 'focus-changed',
        payload: confFileName.fileName,
      })
    }
  }

  public static removePanel(name: string): void {
    const panelToRemove = SettingsPanel.allPanels.find(
      panel => panel.curConfFileDisplayName === name,
    )
    panelToRemove?.dispose()
  }

  /**
   * Open a new webview panel when creating or editing conf files.
   * If the panel is already opened (for editing an existing configuration file),
   * show the same panel.
   * @param extensionUri uri of the extension folder
   * @param editConfFile conf file content
   */

  private openOsPicker(fileType: string, index: number) {
    const uri =
      vscode.workspace.workspaceFolders?.[0].uri || vscode.Uri.parse('')
    const options: vscode.OpenDialogOptions = {
      canSelectMany: false,
      canSelectFolders: false,
      openLabel: 'Open',
      defaultUri: uri,
      filters: {
        'File type': [fileType],
      },
    }

    vscode.window.showOpenDialog(options).then(fileUri => {
      if (fileUri && fileUri[0]) {
        this._panel.webview.postMessage({
          type: 'file-chosen',
          payload: [fileUri[0].fsPath.replace(uri.path + '/', ''), index],
        })
      }
    })
  }

  public static render(
    extensionUri: vscode.Uri,
    confName: ConfNameMap,
    editConfFile?: Record<string, unknown>,
  ): void {
    let isOpened = false
    if (editConfFile) {
      SettingsPanel.allPanels.forEach(panel => {
        if (panel.curConfFileDisplayName === confName.displayName) {
          isOpened = true
          SettingsPanel.currentPanel = panel
        }
      })
    }
    if (isOpened && SettingsPanel.currentPanel) {
      SettingsPanel.currentPanel._panel.reveal(vscode.ViewColumn.One)
    } else {
      this._openNewPanel(extensionUri, confName, editConfFile)
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

  // public static setAllowRun(func: (runName: string) => void): void {
  //   SettingsPanel.allowRun = func
  // }

  public static setResultsWebviewProvider(
    resultsWebviewProvide: ResultsWebviewProvider,
  ): void {
    SettingsPanel.resultsWebviewProvider = resultsWebviewProvide
  }
}
