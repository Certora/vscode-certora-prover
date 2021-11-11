export function refreshFiles(): void {
  vscode.postMessage({
    command: 'smart-contracts-files-refresh',
  })
}
