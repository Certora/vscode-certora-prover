import * as vscode from 'vscode'
export class SmartContractsFilesWatcher {
  files: vscode.Uri[]
  fileSystemWatcher: vscode.FileSystemWatcher
  disposables: vscode.Disposable[]
  webview: vscode.Webview | undefined

  constructor() {
    this.webview = undefined
    this.files = []
    this.disposables = []
    this.fileSystemWatcher =
      vscode.workspace.createFileSystemWatcher('**/*.{sol,spec}')
    this.fileSystemWatcher.onDidChange(file => {
      this.update(file)
    })
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
    this.sendFilesToWebview()
  }

  private create(file: vscode.Uri): void {
    // this.files.push(file)
    // this.nofifyWebviewAboutSolFilesUpdated()
    this.notifyWebviewAboutUpdates(file, 'push')
  }

  private update(file: vscode.Uri): void {
    // this.files = this.files.map(f => (f.fsPath === file.fsPath ? file : f))
    // this.nofifyWebviewAboutSolFilesUpdated()
    this.notifyWebviewAboutUpdates(file, 'map')
  }

  private remove(file: vscode.Uri): void {
    // this.files = this.files.filter(f => f.fsPath !== file.fsPath)
    // this.nofifyWebviewAboutSolFilesUpdated()
    this.notifyWebviewAboutUpdates(file, 'filter')
  }

  private notifyWebviewAboutUpdates(file: vscode.Uri, method: string) {
    if (this.webview) {
      const fileArr = file.path.split('/').reverse()
      const fileObj = {
        value: file.fsPath,
        label: fileArr[0],
        path: file.fsPath.replace(fileArr[0], ''),
      }
      console.log('minor-files-change', {
        method,
        fileObj,
      })
      this.webview.postMessage({
        type: 'minor-files-change',
        payload: {
          method,
          fileObj,
        },
      })
    }
  }

  private sendFilesToWebview() {
    if (this.webview) {
      let sol: { value: string; label: string; path: string }[] = []
      let spec: { value: string; label: string; path: string }[] = []

      this.files.forEach(file => {
        const path = vscode.workspace.asRelativePath(file)
        const label = path.split('/').reverse()[0]
        const fileObj = {
          value: path,
          label: label,
          path: path.replace(label, ''),
        }

        if (fileObj.label.endsWith('.sol')) {
          sol.push(fileObj)
        } else {
          spec.push(fileObj)
        }
      })

      sol = sol.sort((f1, f2) => {
        return this.alphaSort(f1, f2)
      })

      spec = spec.sort((f1, f2) => {
        return this.alphaSort(f1, f2)
      })

      this.webview.postMessage({
        type: 'smart-contracts-files-updated',
        payload: {
          sol,
          spec,
        },
      })
    }
  }

  private alphaSort(
    l1: { value: string; label: string; path: string },
    l2: { value: string; label: string; path: string },
  ): number {
    if (l1.label > l2.label) {
      return 1
    }
    if (l2.label > l1.label) {
      return -1
    }
    if (l1.path > l2.path) {
      return 1
    }
    if (l2.path > l1.path) {
      return -1
    }
    return 0
  }

  public dispose(): void {
    this.disposables.forEach(d => d.dispose())
  }
}
