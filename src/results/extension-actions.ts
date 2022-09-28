import { log, Sources } from './utils/log'
import type { ConfNameMap, JumpToDefinition } from './types'

enum Commands {
  StopScript = 'stop-script',
  RunScript = 'run-script',
  OpenSettings = 'open-settings',
  NavigateToCode = 'navigate-to-code',
  GetOutput = 'get-output',
  EditConfFile = 'edit-confFile',
  DeleteConf = 'delete-confFile',
  Duplicate = 'duplicate',
}

export function stopScript(pid: number): void {
  log({
    action: 'Send "stop-script" command',
    source: Sources.ResultsWebview,
    info: pid,
  })
  vscode.postMessage({
    command: Commands.StopScript,
    payload: pid,
  })
}

export function runScript(name: ConfNameMap): void {
  log({
    action: 'Send "run-script" command',
    source: Sources.ResultsWebview,
  })
  vscode.postMessage({
    command: Commands.RunScript,
    payload: name,
  })
}

export function openSettings(name: ConfNameMap): void {
  log({
    action: 'Send "open-settings" command',
    source: Sources.ResultsWebview,
  })
  vscode.postMessage({
    command: Commands.OpenSettings,
    payload: name,
  })
}

export function editConfFile(name: ConfNameMap): void {
  log({
    action: 'Send "edit-confFile" command',
    source: Sources.ResultsWebview,
  })
  vscode.postMessage({
    command: Commands.EditConfFile,
    payload: name,
  })
}

export function deleteConf(name: ConfNameMap): void {
  log({
    action: 'Send "delete-confFile" command',
    source: Sources.ResultsWebview,
  })
  vscode.postMessage({
    command: Commands.DeleteConf,
    payload: name,
  })
}

export function duplicate(
  toDuplicate: ConfNameMap,
  duplicated: ConfNameMap,
): void {
  log({
    action: 'Send "duplicate" command',
    source: Sources.ResultsWebview,
  })
  vscode.postMessage({
    command: Commands.Duplicate,
    payload: { toDuplicate: toDuplicate, duplicatedName: duplicated },
  })
}

export function navigateToCode(jumpToDefinition: JumpToDefinition[]): void {
  log({
    action: 'Send "navigate-to-code" command',
    source: Sources.ResultsWebview,
    info: jumpToDefinition,
  })

  if (jumpToDefinition.length === 0) return

  vscode.postMessage({
    command: Commands.NavigateToCode,
    payload: jumpToDefinition,
  })
}

export function getOutput(url: string): void {
  log({
    action: 'Send "get-output" command',
    source: Sources.ResultsWebview,
    info: url,
  })
  vscode.postMessage({
    command: Commands.GetOutput,
    payload: url,
  })
}
