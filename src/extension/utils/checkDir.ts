/* ---------------------------------------------------------------------------------------------
 *   if the directory doesn't exist, create one
 *-------------------------------------------------------------------------------------------- */

import * as vscode from 'vscode'

export async function checkDir(uri: vscode.Uri): Promise<boolean> {
  try {
    await vscode.workspace.fs.stat(uri)
    return true
  } catch (e) {
    try {
      await vscode.workspace.fs.createDirectory(uri)
      return true
    } catch (e) {
      console.log(
        'ERROR: could not create directory: ',
        uri.path,
        '[this is an internal error]',
      )
      return false
    }
  }
}
