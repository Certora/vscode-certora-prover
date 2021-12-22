import { log, Sources } from './log'

export function refreshFiles(): void {
  log({
    action: 'Send "smart-contracts-files-refresh" command',
    source: Sources.SettingsWebview,
  })
  vscode.postMessage({
    command: 'smart-contracts-files-refresh',
  })
}
