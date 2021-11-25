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
}

export type ProgressResponse = {
  jobId: string
  jobStatus: string
  jobEnded: boolean
  cloudErrorMessages: string[]
  verificationProgress: string
}
