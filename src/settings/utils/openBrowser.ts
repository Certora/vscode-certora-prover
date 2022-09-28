import { log, Sources } from '../utils/log'

export function openBrowser(fileType: string, index = -1): void {
  log({
    action: 'Send "open-browser" command',
    source: Sources.SettingsWebview,
  })
  vscode.postMessage({
    command: 'open-browser',
    payload: { fileType: fileType, index: index },
  })
}
