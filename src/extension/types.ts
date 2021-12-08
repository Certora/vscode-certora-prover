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
  output: string
}

export type Rule = {
  name: string
  children: Rule[]
  status: RuleStatuses
  asserts: Assert[]
  jumpToDefinition: JumpToDefinition[]
}

export type Tree = {
  spec: string
  contract: string
  rules: Rule[]
  timestamp: number
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

export type Variable = {
  [x: string]: string | boolean | JumpToDefinition[]
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
  variables: Variable[]
}

export type Output = {
  name: string
  assertId: number
  graph_link: string
  jumpToDefinition: JumpToDefinition[]
  result: RuleStatuses
  assertMessage?: string[]
  callResolution: ContractCallResolution[]
  callResolutionWarnings: ContractCallResolution[]
  callTrace?: CallTraceFunction[]
  variables?: Variable[]
}
