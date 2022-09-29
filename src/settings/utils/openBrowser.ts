/* ---------------------------------------------------------------------------------------------
 *  Open browser command is sent to the extension part. It opens the os browser to choose a file.
 *-------------------------------------------------------------------------------------------- */
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
