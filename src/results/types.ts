export type TreeItem = {
  name: string
  childrenList: TreeItem[]
}

export type Tree = TreeItem[]

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

export type Variable = {
  // TODO: Add type for varName: varValue
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
  status: CallTraceFunctionStatuses
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
  graph_link: string
  result: RuleResults
  variables?: Variable[]
  assertMessage?: string[]
  failureCauses?: {
    expr: string
    jumpToDefinition: JumpToDefinition[]
  }
  callTrace: CallTraceFunction[]
  callResolution: CallResolutionItem[]
  callResolutionWarnings: CallResolutionItem[]
  jumpToDefinition: JumpToDefinition[]
}
