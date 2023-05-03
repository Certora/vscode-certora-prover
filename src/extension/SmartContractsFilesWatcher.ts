/* ---------------------------------------------------------------------------------------------
 *  Finds all the solidity / spec files in the workspace and sends them to settings
 *-------------------------------------------------------------------------------------------- */

import * as vscode from 'vscode'
import { FileFormat } from './types'
export class SmartContractsFilesWatcher {
  files: vscode.Uri[]
  filesSol: FileFormat[]
  filesSpec: FileFormat[]
  fileSystemWatcher: vscode.FileSystemWatcher
  disposables: vscode.Disposable[]
  webview: vscode.Webview | undefined

  constructor(path?: vscode.Uri) {
    this.webview = undefined
    this.files = []
    this.filesSol = []
    this.filesSpec = []
    this.disposables = []
    this.fileSystemWatcher =
      vscode.workspace.createFileSystemWatcher('**/*.{sol,spec}')
    this.fileSystemWatcher.onDidCreate(file => {
      this.create(file)
    })
    this.fileSystemWatcher.onDidDelete(file => {
      this.remove(file)
    })

    this.disposables.push(
      this.fileSystemWatcher,
      vscode.workspace.onDidChangeWorkspaceFolders(() => {
        this.init(this.webview, path)
      }),
    )
  }

  public async init(
    webview: vscode.Webview | undefined,
    path?: vscode.Uri,
  ): Promise<void> {
    this.webview = webview
    this.files = await vscode.workspace.findFiles(
      '**/*.{spec,sol}',
      '{.certora_config,.git,emv-*,**/emv-*,**/*.certora_config,**/*.certora_sources,**/*.certora_internal}/**',
    )

    this.filesSol = []
    this.filesSpec = []

    if (path) {
      this.files = this.files.filter(file => {
        return file.path.startsWith(path.path + '/')
      })
    }

    this.files.forEach(file => {
      const fileObj = this.getFileFormat(file, path)
      if (fileObj.type === '.sol') {
        this.filesSol.push(fileObj)
      } else {
        this.filesSpec.push(fileObj)
      }
    })
    this.sendFilesToWebview()
  }

  private create(fileUri: vscode.Uri): void {
    this.notifyWebviewAboutUpdates(fileUri, 'push')
  }

  private remove(fileUri: vscode.Uri): void {
    this.notifyWebviewAboutUpdates(fileUri, 'filter')
  }

  /**
   * when a file is created / deleted from the workspace, only the change is sent to settings
   * @param fileUri uri of the file that has changed
   * @param method either 'push' or 'filter'
   */
  private notifyWebviewAboutUpdates(fileUri: vscode.Uri, method: string) {
    if (this.webview) {
      const file = this.getFileFormat(fileUri)
      this.webview.postMessage({
        type: 'minor-files-change',
        payload: {
          method,
          file,
        },
      })
    }
  }

  private getFileFormat(fileUri: vscode.Uri, basePath?: vscode.Uri) {
    let path = vscode.workspace.asRelativePath(fileUri, true)
    if (basePath) {
      path = fileUri.path.replace(basePath.path + '/', '')
    }

    const fullPath = path

    const fileArr = path.split('/')
    let label = fileArr[fileArr.length - 1]
    // remove labale from path (file.sol)
    path = path.replace(label, '')
    // remove the last character from path (last character is always /)
    path = path.slice(0, -1)
    let type
    if (label.includes('.sol')) {
      type = '.sol'
    } else {
      type = '.spec'
    }
    label = label.replace('.spec', '').replace('.sol', '')
    return {
      value: fullPath,
      label,
      path: basePath ? basePath.path + '/' + path : path,
      type,
    }
  }

  private sendFilesToWebview() {
    if (this.webview) {
      this.webview.postMessage({
        type: 'smart-contracts-files-updated',
        payload: {
          sol: this.filesSol,
          spec: this.filesSpec,
        },
      })
    }
  }

  public dispose(): void {
    this.disposables.forEach(d => d.dispose())
  }
}
