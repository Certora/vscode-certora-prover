/* ---------------------------------------------------------------------------------------------
 *  Here we declare types and enums
 *-------------------------------------------------------------------------------------------- */

export type Action = {
  title: string
  onClick?: () => void
  icon: string
  link?: string
}

export type JumpToDefinition = {
  file: string
  line: number
  col: number
}

export enum RuleStatuses {
  Verified = 'VERIFIED',
  Violated = 'VIOLATED',
  Error = 'ERROR',
  Skipped = 'SKIPPED',
  Unknown = 'UNKNOWN',
  Running = 'RUNNING',
  Timeout = 'TIMEOUT',
}

export type Assert = {
  message: string
  status: RuleStatuses
  id: number
  duration: number
  jumpToDefinition: JumpToDefinition[]
  output: string | null
  jobId: string | null
}

export type Rule = {
  name: string
  children: Rule[]
  status: RuleStatuses
  asserts: Assert[]
  jumpToDefinition: JumpToDefinition[]
  duration: number
  output: string | null
  jobId: string | null
}

export type Tree = {
  spec: string
  contract: string
  rules: Rule[]
  timestamp: number
}

export type ContractCallResolution = {
  caller: {
    name: string
    jumpToDefinition: JumpToDefinition[]
  }
  callee: {
    name: string
    jumpToDefinition: JumpToDefinition[]
  }
  summary: string
  comments: Record<string, string>[]
}

export type SourceVariable = {
  [x: string]: string | boolean | JumpToDefinition[]
}

export type ResultVariable = {
  name: string
  value: string | boolean
  jumpToDefinition: JumpToDefinition[]
}

export enum CallTraceFunctionStatuses {
  Success = 'SUCCESS',
  Revert = 'REVERT',
  Summarized = 'SUMMARIZED',
  Havoc = 'HAVOC',
  Throw = 'THROW',
  Dispatcher = 'DISPATCHER',
  RevertCause = 'REVERT CAUSE',
  Dump = 'DUMP',
}

export type CallTraceFunction = {
  name: string
  returnValue: string
  status: CallTraceFunctionStatuses
  childrenList: CallTraceFunction[]
  jumpToDefinition: JumpToDefinition[]
  variables: SourceVariable[]
}

type TreeViewPath = {
  ruleName: string | null
  assertId: number | null
  next: TreeViewPath | null
}

export type Output = {
  runName?: string
  treeViewPath: TreeViewPath
  graph_link: string
  jumpToDefinition: JumpToDefinition[]
  result: RuleStatuses
  assertMessage?: string[]
  callResolution: ContractCallResolution[]
  callResolutionWarnings: ContractCallResolution[]
  callTrace?: CallTraceFunction
  variables?: SourceVariable[]
}

export enum TreeType {
  Rules = 'rules',
  Calltrace = 'calltrace',
}

export type Job = {
  jobId: string
  jobStatus: string
  jobEnded: boolean
  cloudErrorMessages: string[]
  verificationProgress: Tree
  progressUrl: string
  creationTime: string
  runName?: string
  verificationReportLink?: string
}

export type ProgressResponse = {
  jobId: string
  jobStatus: string
  jobEnded: boolean
  cloudErrorMessages: string[]
  verificationProgress: string
}

export type Verification = {
  name: string
  spec: string
  contract: string
  jobs: Job[]
}

export type CreationTime = {
  postTime: string
}

export type ConfToCreate = {
  fileName: string
  allowRun: number
}

export enum EventTypesFromExtension {
  ReceiveNewJobResult = 'receive-new-job-result',
  RunningScriptChanged = 'running-scripts-changed',
  SetOutput = 'set-output',
  ClearAllJobs = 'clear-all-jobs',
  SetCreationTime = 'set-creation-time',
  CreateJob = 'create-new-job',
  ParseError = 'parse-error',
  AllowRun = 'allow-run',
  BlockRun = 'block-run',
  FocusChanged = 'focus-changed',
  UploadingFiles = 'run-next',
  ScriptStopped = 'script-stopped',
  InitialJobs = 'initial-jobs',
  DeleteJob = 'delete-job',
}

export type EventsFromExtension =
  | {
      type: EventTypesFromExtension.ReceiveNewJobResult
      payload: Job
    }
  | {
      type: EventTypesFromExtension.RunningScriptChanged
      payload: { pid: number; confFile: string; uploaded: boolean }[]
    }
  | {
      type: EventTypesFromExtension.SetOutput
      payload: Output
    }
  | {
      type: EventTypesFromExtension.ClearAllJobs
    }
  | {
      type: EventTypesFromExtension.SetCreationTime
      payload: CreationTime
    }
  | {
      type: EventTypesFromExtension.CreateJob
    }
  | {
      type: EventTypesFromExtension.ParseError
      payload: string
    }
  | {
      type: EventTypesFromExtension.AllowRun
      payload: string
    }
  | {
      type: EventTypesFromExtension.BlockRun
      payload: string
    }
  | {
      type: EventTypesFromExtension.FocusChanged
      payload: string
    }
  | {
      type: EventTypesFromExtension.UploadingFiles
      payload: number
    }
  | {
      type: EventTypesFromExtension.ScriptStopped
      payload: number
    }
  | {
      type: EventTypesFromExtension.InitialJobs
      payload: ConfToCreate[]
    }
  | {
      type: EventTypesFromExtension.DeleteJob
      payload: string
    }

export type JobNameMap = {
  displayName: string
  fileName: string
}

export enum Status {
  missingSettings = 'Missing settings',
  ready = 'Ready',
  running = 'Running',
  pending = 'Pending',
  success = 'Ready success',
  unableToRun = 'Unable to run',
  incompleteResults = 'Incomplete results',
}

export type Run = {
  id: number
  name: string
  status: Status
  vrLink?: string
}
