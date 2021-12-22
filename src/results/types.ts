export type Action = { title: string; onClick: () => void; icon: string }

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
}

export type Rule = {
  name: string
  children: Rule[]
  status: RuleStatuses
  asserts: Assert[]
  jumpToDefinition: JumpToDefinition[]
  duration: number
  output: string | null
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
}

export type ProgressResponse = {
  jobId: string
  jobStatus: string
  jobEnded: boolean
  cloudErrorMessages: string[]
  verificationProgress: string
}

export enum EventTypesFromExtension {
  ReceiveNewJobResult = 'receive-new-job-result',
  RunningScriptChanged = 'running-scripts-changed',
  SetOutput = 'set-output',
  ClearAllJobs = 'clear-all-jobs',
}

export type EventsFromExtension =
  | {
      type: EventTypesFromExtension.ReceiveNewJobResult
      payload: Job
    }
  | {
      type: EventTypesFromExtension.RunningScriptChanged
      payload: { pid: number; confFile: string }[]
    }
  | {
      type: EventTypesFromExtension.SetOutput
      payload: Output
    }
  | {
      type: EventTypesFromExtension.ClearAllJobs
    }
