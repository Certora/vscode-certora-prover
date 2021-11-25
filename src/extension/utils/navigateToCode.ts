import * as vscode from 'vscode'
import type { JumpToDefinition } from '../types'

export async function navigateToCode(
  jumpToDefinition: JumpToDefinition[],
): Promise<void> {
  const base = vscode.workspace.workspaceFolders?.[0].uri

  if (!base) return

  const documentsToUpdateFocus: {
    document: vscode.TextDocument
    line: number
    col: number
  }[] = []
  const documentsToOpen: JumpToDefinition[] = []
  const openedDocuments = vscode.workspace.textDocuments

  jumpToDefinition.forEach(item => {
    const documentAlreadyOpened = openedDocuments.find(
      doc => doc.uri.path === vscode.Uri.joinPath(base, item.file).path,
    )

    if (documentAlreadyOpened) {
      documentsToUpdateFocus.push({
        document: documentAlreadyOpened,
        line: item.line,
        col: item.col,
      })
    } else {
      documentsToOpen.push(item)
    }
  })

  if (documentsToUpdateFocus.length > 0) {
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

  if (documentsToOpen.length === 0) return

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
}
