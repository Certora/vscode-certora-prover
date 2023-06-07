/* ---------------------------------------------------------------------------------------------
 *  Settings webview actions.
 *-------------------------------------------------------------------------------------------- */

import * as vscode from 'vscode'
import { SmartContractsFilesWatcher } from './SmartContractsFilesWatcher'
import { getNonce } from './utils/getNonce'
import { createConfFile } from './utils/createConfFile'
import { log, Sources } from './utils/log'
import {
  CommandFromSettingsWebview,
  ConfFile,
  JobNameMap,
  EventFromSettingsWebview,
  NewForm,
  CONF_DIRECTORY,
} from './types'
import { ResultsWebviewProvider } from './ResultsWebviewProvider'

export class SettingsPanel {
  public static currentPanel?: SettingsPanel
  private readonly _panel: vscode.WebviewPanel
  private _disposables: vscode.Disposable[] = []
  private watcher: SmartContractsFilesWatcher
  private confFilePath: string
  private static allPanels: SettingsPanel[] = []
  private static resultsWebviewProvider: ResultsWebviewProvider

  private constructor(
    panel: vscode.WebviewPanel,
    extensionUri: vscode.Uri,
    confFileDisplayName: string,
    confFilePath: string,
    editConfFile?: ConfFile,
  ) {
    this.confFilePath = confFilePath

    this._panel = panel

    this._panel.webview.html = this._getWebviewContent(
      this._panel.webview,
      extensionUri,
    )
    const pathToUse = confFilePath.split(CONF_DIRECTORY)[0]
    this.watcher = new SmartContractsFilesWatcher(vscode.Uri.parse(pathToUse))
    this.watcher.init(this._panel.webview, vscode.Uri.parse(pathToUse))
    if (editConfFile) {
      const name =
        confFileDisplayName !== '' ? confFileDisplayName : confFilePath
      this._panel.webview.postMessage({
        type: 'edit-conf-file',
        payload: { confFile: editConfFile, runName: name },
      })
    }

    this._panel.onDidChangeViewState(e => {
      if (e.webviewPanel.visible) {
        if (SettingsPanel.resultsWebviewProvider) {
          SettingsPanel.resultsWebviewProvider.postMessage({
            type: 'focus-changed',
            payload: confFilePath,
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
            if (confFilePath) {
              const pathToUse = confFilePath.split(CONF_DIRECTORY)[0]
              this.watcher.init(
                this._panel.webview,
                vscode.Uri.parse(pathToUse),
              )
            } else {
              this.watcher.init(this._panel.webview)
            }
            break
          case CommandFromSettingsWebview.CreateConfFile: {
            log({
              action: 'Received "create-conf-file" command',
              source: Sources.Extension,
              info: e.payload,
            })
            const form: NewForm = e.payload
            if (confFilePath) {
              createConfFile(form, confFilePath)
            }
            if (
              form.solidityObj.mainContract &&
              form.solidityObj.mainFile &&
              form.solidityObj.compiler.ver &&
              form.specObj.specFile &&
              !e.payload.checkMyInputs
            ) {
              // if all mandatory fields are filled - allow running
              SettingsPanel.resultsWebviewProvider.postMessage({
                type: 'allow-run',
                payload: confFilePath,
              })
            } else if (!e.payload.checkMyInputs) {
              SettingsPanel.resultsWebviewProvider.postMessage({
                type: 'block-run',
                payload: confFilePath,
              })
            } else {
              SettingsPanel.resultsWebviewProvider.postMessage({
                type: 'settings-error',
                payload: confFilePath,
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
            this.openOsPicker(e.payload.fileType, e.payload.index)
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
    if (!SettingsPanel.allPanels.length) {
      if (SettingsPanel.resultsWebviewProvider) {
        SettingsPanel.resultsWebviewProvider.postMessage({
          type: 'focus-changed',
          payload: '',
        })
      }
    }
    this.dispose()
  }

  public static disableForm(name: string): void {
    const panelToDisable = SettingsPanel.allPanels.find(
      panel => panel.confFilePath === name,
    )
    if (panelToDisable !== undefined) {
      panelToDisable._panel.webview.postMessage({
        type: 'disable-form',
        payload: panelToDisable.confFilePath,
      })
    }
  }

  public static enableForm(name: string): void {
    const panelToDisable = SettingsPanel.allPanels.find(
      panel => panel.confFilePath === name,
    )
    if (panelToDisable !== undefined) {
      panelToDisable._panel.webview.postMessage({
        type: 'enable-form',
        payload: panelToDisable.confFilePath,
      })
    }
  }

  /**
   * opens a new settings panel in a new tab
   * @param extensionUri uri of the extension folder
   * @param confFileName the name of a run, in a type that holds both conf file name
   * and display name of the run
   * @param editConfFile conf file content
   */
  private static _openNewPanel(
    extensionUri: vscode.Uri,
    confFileName: JobNameMap,
    editConfFile?: ConfFile,
  ) {
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
      confFileName.confPath,
      editConfFile,
    )
    this.allPanels.push(SettingsPanel.currentPanel)
    if (SettingsPanel.resultsWebviewProvider) {
      SettingsPanel.resultsWebviewProvider.postMessage({
        type: 'focus-changed',
        payload: confFileName.confPath,
      })
    }
  }

  public static removePanel(name: string): void {
    const panelToRemove = SettingsPanel.allPanels.find(
      panel => panel.confFilePath === name,
    )
    panelToRemove?.dispose()
  }

  /**
   * Open a new webview panel when creating or editing conf files.
   * If the panel is already opened (for editing an existing configuration file),
   * show the same panel.
   * @param fileType file extension
   * @param index if the file is an additional contract file - the index of the additional file.
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
        const file = fileUri[0].fsPath.replace(uri.path + '/', '')
        const fileArr = file.split('/')
        const labelTypeArr: string[] = fileArr.pop()?.split('.') || []
        const label = labelTypeArr[0]
        const path = fileArr[0]
        const type = '.' + labelTypeArr[1]
        const fileInFormat = {
          value: file,
          label: label,
          path: path,
          type: type,
        }
        this._panel.webview.postMessage({
          type: 'file-chosen',
          payload: {
            file: fileInFormat,
            index: index,
          },
        })
      }
    })
  }

  /**
   * renders a settings webview.
   * if the settings webview with name [confName] already exists, skip to it
   * if not - create and skip to it
   * @param extensionUri extention uri
   * @param confName the name of a run, in a type that holds both conf file name
   * and display name of the run
   * @param editConfFile conf file with information to fill settings view with
   */
  public static render(
    extensionUri: vscode.Uri,
    confName: JobNameMap,
    editConfFile?: ConfFile,
  ): void {
    let isOpened = false
    if (editConfFile) {
      SettingsPanel.allPanels.forEach(panel => {
        if (panel.confFilePath === confName.confPath) {
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

  public static setResultsWebviewProvider(
    resultsWebviewProvide: ResultsWebviewProvider,
  ): void {
    SettingsPanel.resultsWebviewProvider = resultsWebviewProvide
  }
}
