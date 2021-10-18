import type { JumpToDefinition } from '../types'

export function navigateToCode(jumpToDefinition: JumpToDefinition[]): void {
  if (jumpToDefinition.length === 0) return

  vscode.postMessage({
    command: 'navigate-to-code',
    payload: jumpToDefinition,
  })
}
