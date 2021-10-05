export type Action = { title: string; onClick: () => void; icon: string }

export type JumpToDefinition = {
  file: string
  line: number
  col: number
}

export enum RuleResults {
  Success = 'SUCCESS',
  Violated = 'VIOLATED',
  Error = 'ERROR',
  Unknown = 'UNKNOWN',
  Skip = 'SKIP',
}

export type Variable = Record<string, string | boolean> & {
  jumpToDefinition: JumpToDefinition[]
}

export enum CallTraceFunctionStatuses {
  Success = 'SUCCESS',
  Revert = 'REVERT',
  Summarized = 'SUMMARIZED',
  Havoc = 'HAVOC',
  Throw = 'THROW',
  Dispatcher = 'DISPATCHER',
  RevertCause = 'REVERT_CAUSE',
  Dump = 'DUMP',
}

export type CallTraceFunction = {
  name: string
  returnValue: string
  status: CallTraceFunctionStatuses | ''
  childrenList: CallTraceFunction[]
  jumpToDefinition: JumpToDefinition[]
}

export type CallResolutionItem = {
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

export type Rule = {
  name: string
  parent_rule?: string
  graph_link?: string
  result?: RuleResults
  duration?: number
  variables?: Variable[]
  assertMessage?: string[]
  failureCauses?: {
    expr: string
    jumpToDefinition: JumpToDefinition[]
  }
  callTrace?: CallTraceFunction[]
  callResolution?: CallResolutionItem[]
  callResolutionWarnings?: CallResolutionItem[]
  jumpToDefinition?: JumpToDefinition[]
  childrenList?: Rule[]
}

export type RuleTreeChildren =
  | (Rule & { childrenList: Rule[] })
  | {
      isAssertMessageNode?: boolean
    }

export type RuleTreeItem = {
  name: string
  graph_link?: string
  result?: RuleResults
  duration?: number
  variables?: Variable[]
  assertMessage?: string[]
  isAssertMessageNode?: boolean
  failureCauses?: {
    expr: string
    jumpToDefinition: JumpToDefinition[]
  }
  callTrace?: CallTraceFunction[]
  callResolution?: CallResolutionItem[]
  callResolutionWarnings?: CallResolutionItem[]
  jumpToDefinition?: JumpToDefinition[]
  childrenList: RuleTreeChildren[]
}

export type RuleTree = RuleTreeItem[]

export enum TreeType {
  Rules = 'rules',
  Calltrace = 'calltrace',
}
