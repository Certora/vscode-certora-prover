/* ---------------------------------------------------------------------------------------------
 *  Results actions to send to the extension part. When there is an action that has to do with sending
 *  information from the Results part of the application to the extension part,
 *  it is sent in here, with the corresponding function.
 *-------------------------------------------------------------------------------------------- */

import { log, Sources } from './utils/log'
import type { JobNameMap, JumpToDefinition } from './types'
import type { Uri } from 'vscode'

enum Commands {
  StopScript = 'stop-script',
  RunScript = 'run-script',
  OpenSettings = 'open-settings',
  NavigateToCode = 'navigate-to-code',
  GetOutput = 'get-output',
  EditConfFile = 'edit-confFile',
  DeleteConf = 'delete-confFile',
  Duplicate = 'duplicate',
  RemoveScript = 'remove-script',
  AskToDeleteJob = 'ask-to-delete-job',
  InitResults = 'init-results',
  UploadConf = 'upload-conf',
  EnableEdit = 'enable-edit',
  Rename = 'rename',
}

export function enableEdit(name: JobNameMap): void {
  log({
    action: 'Send "enable-edit" command',
    source: Sources.ResultsWebview,
  })
  vscode.postMessage({
    command: Commands.EnableEdit,
    payload: name,
  })
}

export function uploadConf(jobListUri?: Uri): void {
  log({
    action: 'Send "upload-conf" command',
    source: Sources.ResultsWebview,
    info: jobListUri,
  })
  vscode.postMessage({
    command: Commands.UploadConf,
    payload: jobListUri,
  })
}

export function initResults(): void {
  log({
    action: 'Send "init-results" command',
    source: Sources.ResultsWebview,
  })
  vscode.postMessage({
    command: Commands.InitResults,
  })
}

export function removeScript(name: string): void {
  log({
    action: 'Send "remove-script" command',
    source: Sources.ResultsWebview,
    info: name,
  })
  vscode.postMessage({
    command: Commands.RemoveScript,
    payload: name,
  })
}

export function stopScript(pid: number, modal: boolean): void {
  log({
    action: 'Send "stop-script" command',
    source: Sources.ResultsWebview,
    info: { pid, modal },
  })
  vscode.postMessage({
    command: Commands.StopScript,
    payload: { pid: pid, modal: modal },
  })
}

export function runScript(name: JobNameMap): void {
  log({
    action: 'Send "run-script" command',
    source: Sources.ResultsWebview,
  })
  vscode.postMessage({
    command: Commands.RunScript,
    payload: name,
  })
}

export function openSettings(name: JobNameMap): void {
  log({
    action: 'Send "open-settings" command',
    source: Sources.ResultsWebview,
  })
  vscode.postMessage({
    command: Commands.OpenSettings,
    payload: name,
  })
}

export function editConfFile(name: JobNameMap): void {
  log({
    action: 'Send "edit-confFile" command',
    source: Sources.ResultsWebview,
  })
  vscode.postMessage({
    command: Commands.EditConfFile,
    payload: name,
  })
}

export function deleteConf(name: JobNameMap): void {
  log({
    action: 'Send "delete-confFile" command',
    source: Sources.ResultsWebview,
  })
  vscode.postMessage({
    command: Commands.DeleteConf,
    payload: name,
  })
}

export function askToDeleteJob(name: JobNameMap): void {
  log({
    action: 'Send "ask-to-delete-job" command',
    source: Sources.ResultsWebview,
  })
  vscode.postMessage({
    command: Commands.AskToDeleteJob,
    payload: name,
  })
}

export function duplicate(
  toDuplicate: JobNameMap,
  duplicated: JobNameMap,
  rule?: string,
): void {
  log({
    action: 'Send "duplicate" command',
    source: Sources.ResultsWebview,
    info: [toDuplicate, duplicated, rule],
  })
  vscode.postMessage({
    command: Commands.Duplicate,
    payload: {
      toDuplicate: toDuplicate,
      duplicatedName: duplicated,
      rule: rule,
    },
  })
}

export function rename(oldName: JobNameMap, newName: JobNameMap): void {
  log({
    action: 'Send "rename" command',
    source: Sources.ResultsWebview,
    info: [oldName, newName],
  })
  vscode.postMessage({
    command: Commands.Rename,
    payload: {
      oldName: oldName,
      newName: newName,
    },
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
