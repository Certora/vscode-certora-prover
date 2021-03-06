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
      '**/*.{sol,spec,cvl}',
      '{.certora_config,.git,emv-*,**/emv-*,**/*.certora_config}/**',
    )
    this.nofifyWebviewAboutSolFilesUpdated()
  }

  private create(file: vscode.Uri): void {
    this.files.push(file)
    this.nofifyWebviewAboutSolFilesUpdated()
  }

  private update(file: vscode.Uri): void {
    this.files = this.files.map(f => (f.fsPath === file.fsPath ? file : f))
    this.nofifyWebviewAboutSolFilesUpdated()
  }

  private remove(file: vscode.Uri): void {
    this.files = this.files.filter(f => f.fsPath !== file.fsPath)
    this.nofifyWebviewAboutSolFilesUpdated()
  }

  private nofifyWebviewAboutSolFilesUpdated() {
    if (this.webview) {
      const sol: string[] = []
      const spec: string[] = []

      this.files.forEach(file => {
        const path = vscode.workspace.asRelativePath(file)

        if (file.path.endsWith('.sol')) {
          sol.push(path)
        } else {
          spec.push(path)
        }
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

  public dispose(): void {
    this.disposables.forEach(d => d.dispose())
  }
}
