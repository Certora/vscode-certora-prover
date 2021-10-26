import * as vscode from 'vscode'

export class SolFilesWatcher {
  solFiles: vscode.Uri[]
  fileSystemWatcher: vscode.FileSystemWatcher
  disposables: vscode.Disposable[]
  webview: vscode.Webview | undefined

  constructor() {
    this.webview = undefined
    this.solFiles = []
    this.disposables = []
    this.fileSystemWatcher =
      vscode.workspace.createFileSystemWatcher('**/*.sol')
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
    this.solFiles = await vscode.workspace.findFiles(
      '**/*.sol',
      '/{node_modules,.git}/**',
    )
    this.nofifyWebviewAboutSolFilesUpdated()
  }

  private create(file: vscode.Uri): void {
    this.solFiles.push(file)
    this.nofifyWebviewAboutSolFilesUpdated()
  }

  private update(file: vscode.Uri): void {
    this.solFiles = this.solFiles.map(f =>
      f.fsPath === file.fsPath ? file : f,
    )
    this.nofifyWebviewAboutSolFilesUpdated()
  }

  private remove(file: vscode.Uri): void {
    this.solFiles = this.solFiles.filter(f => f.fsPath !== file.fsPath)
    this.nofifyWebviewAboutSolFilesUpdated()
  }

  private nofifyWebviewAboutSolFilesUpdated() {
    console.log(this.webview, this.solFiles)
    if (this.webview) {
      this.webview.postMessage({
        type: 'sol-files-updated',
        payload: this.solFiles,
      })
    }
  }

  public dispose(): void {
    this.disposables.forEach(d => d.dispose())
  }
}
