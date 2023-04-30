/* ---------------------------------------------------------------------------------------------
 *  Open [file], focus on ([line], [col])
 *-------------------------------------------------------------------------------------------- */

import * as vscode from 'vscode'
import type { JumpToDefinition } from '../types'

// todo: add path to spec instead of base path (for multiple dir option)

export async function navigateToCode(
  jumpToDefinition: JumpToDefinition[],
  path: string,
): Promise<void> {
  try {
    const jtd = jumpToDefinition.map(item => ({
      ...item,
      line: item.line - 1,
      col: item.col - 1,
    }))
    const base = vscode.Uri.parse(path)
    if (!base) return

    const documentsToUpdateFocus: {
      document: vscode.TextDocument
      line: number
      col: number
    }[] = []
    const documentsToOpen: JumpToDefinition[] = []
    const openedEditors = vscode.window.visibleTextEditors

    jtd.forEach(item => {
      const editorAlreadyOpened = openedEditors.find(
        editor =>
          editor.document.uri.path ===
          vscode.Uri.joinPath(base, item.file).path,
      )

      if (editorAlreadyOpened) {
        documentsToUpdateFocus.push({
          document: editorAlreadyOpened.document,
          line: item.line,
          col: item.col,
        })
      } else {
        documentsToOpen.push(item)
      }
    })

    if (documentsToUpdateFocus.length) {
      vscode.window.visibleTextEditors.forEach(editor => {
        documentsToUpdateFocus.forEach(({ document, line, col }) => {
          if (editor.document.uri.path === document.uri.path) {
            const range = new vscode.Range(line, col, line, col)
            editor.selection = new vscode.Selection(line, col, line, col)
            editor.revealRange(
              range.with(new vscode.Position(Math.max(line - 1, 0), col)),
              vscode.TextEditorRevealType.InCenterIfOutsideViewport,
            )
          }
        })
      })
    }

    if (!documentsToOpen.length) return

    for (const item of documentsToOpen) {
      const { file, line, col } = item
      const pathToFile = vscode.Uri.joinPath(base, file).toString()
      const document = await vscode.workspace.openTextDocument(
        vscode.Uri.parse(pathToFile),
      )
      const range = new vscode.Range(line, col, line, col)
      const editor = await vscode.window.showTextDocument(document, {
        selection: range,
        viewColumn: vscode.ViewColumn.Beside,
      })

      editor.revealRange(
        range.with(new vscode.Position(Math.max(line - 1, 0), col)),
        vscode.TextEditorRevealType.InCenterIfOutsideViewport,
      )
    }
  } catch (e) {
    vscode.window.showErrorMessage(
      `Failed to navigate to code. Navigation data: ${JSON.stringify(
        jumpToDefinition,
      )}. Error: ${e}`,
    )
  }
}
