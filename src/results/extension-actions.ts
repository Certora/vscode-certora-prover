import type { JumpToDefinition } from './types'

enum Commands {
  StopScript = 'stop-script',
  RunScript = 'run-script',
  OpenSettings = 'open-settings',
  NavigateToCode = 'navigate-to-code',
  GetOutput = 'get-output',
}

export function stopScript(pid: number): void {
  vscode.postMessage({
    command: Commands.StopScript,
    payload: pid,
  })
}

export function runScript(): void {
  vscode.postMessage({
    command: Commands.RunScript,
  })
}

export function openSettings(): void {
  vscode.postMessage({
    command: Commands.OpenSettings,
  })
}

export function navigateToCode(jumpToDefinition: JumpToDefinition[]): void {
  if (jumpToDefinition.length === 0) return

  vscode.postMessage({
    command: Commands.NavigateToCode,
    payload: jumpToDefinition,
  })
}

export function getOutput(url: string): void {
  vscode.postMessage({
    command: Commands.GetOutput,
    payload: url,
  })
}
