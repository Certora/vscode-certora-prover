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
  creationTime: string
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
  callTrace?: CallTraceFunction[]
  variables?: Variable[]
}

export type InputFormData = {
  name: string
  mainSolidityFile: string
  mainContractName: string
  specFile: string
  solidityCompiler: string
  useAdditionalContracts: boolean
  additionalContracts: {
    file: string
    name?: string
  }[]
  link: {
    id: string
    contractName: string
    fieldName: string
    associatedContractName: string
  }[]
  extendedSettings: {
    id: string
    flag: string
  }[]
  useStaging: boolean
  branch: string
  cacheName: string
  message: string
  additionalSettings: {
    id: string
    option: string
    value: string
  }[]
  solc_map: { contract: string; solidityCompiler: string }[]
}

export type ConfNameMap = {
  displayName: string
  fileName: string
}

export type Compiler = {
  exe: string
  ver: string
}

export type SolidityPackageDir = {
  packageName: string
  path: string
}

export type Link = {
  id?: string
  variable: string
  contractName: string
  fieldName?: string
  associatedContractName?: string
}

// solidity part of the new settings view
export type SolidityObj = {
  mainFile: { value: string; label: string; path: string }
  mainContract: string
  linking: Link[]
  specifiMethod: string
  compiler: Compiler
  solidityArgument: string
  solidityPackageDefaultPath: string
  solidityPackageDir: SolidityPackageDir[]
}

export type Property = {
  name: string
  value: string
}

// spec part of the new settings view
export type SpecObj = {
  specFile: string
  rules: string
  duration: string
  inherit: string
  optimisticLoop: boolean
  loopUnroll: string
  properties: Property[]
  runOnStg: boolean
  branchName: string
  localTypeChecking: boolean
  shortOutput: boolean
  multiAssert: boolean
}

export type NewForm = {
  solidyObj: SolidityObj
  specObj: SpecObj
  verificatoinMessage: string
  solidityAdditionalContracts?: SolidityObj[] // multiple contracts
}

export enum CommandFromResultsWebview {
  NavigateToCode = 'navigate-to-code',
  StopScript = 'stop-script',
  RunScript = 'run-script',
  OpenSettings = 'open-settings',
  GetOutput = 'get-output',
  GetCreationTime = 'get-creation-time',
  EditConfFile = 'edit-confFile',
  DeleteConfFile = 'delete-confFile',
  Duplicate = 'duplicate',
}

export enum CommandFromSettingsWebview {
  SmartContractsFilesRefresh = 'smart-contracts-files-refresh',
  CreateConfFile = 'create-conf-file',
  OpenBrowser = 'open-browser',
}

export type EventFromResultsWebview =
  | {
      command: CommandFromResultsWebview.NavigateToCode
      payload: JumpToDefinition[]
    }
  | {
      command: CommandFromResultsWebview.StopScript
      payload: number
    }
  | {
      command: CommandFromResultsWebview.RunScript
      payload: ConfNameMap
    }
  | {
      command: CommandFromResultsWebview.OpenSettings
      payload: ConfNameMap
    }
  | {
      command: CommandFromResultsWebview.GetOutput
      payload: string
    }
  | {
      command: CommandFromResultsWebview.GetCreationTime
      payload: string
    }
  | {
      command: CommandFromResultsWebview.EditConfFile
      payload: ConfNameMap
    }
  | {
      command: CommandFromResultsWebview.DeleteConfFile
      payload: ConfNameMap
    }
  | {
      command: CommandFromResultsWebview.Duplicate
      payload: [ConfNameMap, ConfNameMap]
    }

export type EventFromSettingsWebview =
  | {
      command: CommandFromSettingsWebview.SmartContractsFilesRefresh
    }
  | {
      command: CommandFromSettingsWebview.CreateConfFile
      payload: NewForm
    }
  | {
      command: CommandFromSettingsWebview.OpenBrowser
      payload: string
    }

export type ConfFile = {
  contracts?: string[]
  verify?: [string]
  solc?: string
  link?: string[]
  settings?: string[]
  staging?: string
  cache?: string
  msg?: string
  solc_map?: string
} & Record<string, boolean | string | string[] | number>

export type Message = {
  message: string
  location: []
}

export type Topic = {
  name: string
  messages: Message[]
}

export type ResourceError = {
  topics: Topic[]
}
