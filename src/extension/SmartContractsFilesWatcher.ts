import * as vscode from 'vscode'

export class SmartContractsFilesWatcher {
  files: vscode.Uri[]
  filesSol: { value: string; label: string; path: string }[]
  filesSpec: { value: string; label: string; path: string }[]
  fileSystemWatcher: vscode.FileSystemWatcher
  disposables: vscode.Disposable[]
  webview: vscode.Webview | undefined

  constructor() {
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
        this.init(this.webview)
      }),
    )
  }

  public async init(webview: vscode.Webview | undefined): Promise<void> {
    this.webview = webview
    this.files = await vscode.workspace.findFiles(
      '**/*.{sol,spec}',
      '{.certora_config,.git,emv-*,**/emv-*,**/*.certora_config}/**',
    )

    this.files.forEach(file => {
      const fileObj = this.getFileFormat(file)

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

  private notifyWebviewAboutUpdates(fileUri: vscode.Uri, method: string) {
    if (this.webview) {
      const file = this.getFileFormat(fileUri)
      console.log('minor-files-change', {
        method,
        file,
      })
      this.webview.postMessage({
        type: 'minor-files-change',
        payload: {
          method,
          file,
        },
      })
    }
  }

  private getFileFormat(fileUri: vscode.Uri) {
    let path = vscode.workspace.asRelativePath(fileUri, true)
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
      value: fileUri.fsPath,
      label,
      path,
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
