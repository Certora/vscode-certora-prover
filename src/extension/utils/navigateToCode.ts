import * as vscode from 'vscode'

export type JumpToDefinition = {
  file: string
  line: number
  col: number
}

export async function navigateToCode(
  jumpToDefinition: JumpToDefinition[],
): Promise<void> {
  const base = vscode.workspace.workspaceFolders?.[0].uri

  if (!base) return

  const openedFiles = vscode.workspace.textDocuments.map(doc => doc.uri.path)
  const filesForOpen = jumpToDefinition.filter(
    ({ file }) => !openedFiles.includes(vscode.Uri.joinPath(base, file).path),
  )

  if (filesForOpen.length === 0) return

  for (const item of filesForOpen) {
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
      vscode.TextEditorRevealType.AtTop,
    )
  }
}
