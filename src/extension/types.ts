/* ---------------------------------------------------------------------------------------------
 *  Here we declare types and enums
 *-------------------------------------------------------------------------------------------- */

export const CONF_DIRECTORY_NAME = 'certora/conf'
export const CONF_DIRECTORY = 'certora/conf/'
export const SH_DIRECTORY_NAME = 'certora/scripts'
export const SH_DIRECTORY = 'certora/scripts/'
export const CERTORA_INNER_DIR = '/.certora_internal/'
export const CERTORA_INNER_DIR_BUILD = '/.certora_internal/scripts_to_build/'
export const LOG_DIRECTORY_DEFAULT = 'certora_logs'
export const LAST_CONFS = '.last_confs'

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
  Sanity = 'SANITY_FAILED',
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
  runName?: string
  pid?: number
  verificationReportLink?: string
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

export type JobNameMap = {
  displayName: string
  confPath: string
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
  variable: string
  contractName: string
  fieldName?: string
  associatedContractName?: string
}

export type SolcArg = {
  key: string
  value: string
}

export type FileFormat = {
  value: string
  label: string
  path: string
  type?: string
}

// solidity part of the new settings view
export type SolidityObj = {
  mainFile: any
  mainContract: string
  linking: Link[]
  compiler: Compiler
  solidityArgs: SolcArg[]
  solidityPackageDefaultPath: string
  solidityPackageDir: SolidityPackageDir[]
}

export type Property = {
  name: string
  value: string
}

// spec part of the new settings view
export type SpecObj = {
  specFile: any
  rules: string
  duration: string
  optimisticLoop: boolean
  loopUnroll: string
  properties: Property[]
  runOnStg: boolean
  branchName: string
  ruleSanity: boolean
  advancedSanity: boolean
  localTypeChecking: boolean
  multiAssert: boolean
  sendOnly: boolean
  runSource?: string
}

export type NewForm = {
  solidityObj: SolidityObj
  specObj: SpecObj
  verificationMessage: string
  solidityAdditionalContracts?: SolidityObj[] // multiple contracts
  checkMyInputs: boolean
}

export enum CommandFromResultsWebview {
  NavigateToCode = 'navigate-to-code',
  StopScript = 'stop-script',
  RunScript = 'run-script',
  OpenSettings = 'open-settings',
  GetOutput = 'get-output',
  EditConfFile = 'edit-confFile',
  DeleteConfFile = 'delete-confFile',
  Duplicate = 'duplicate',
  RemoveScript = 'remove-script',
  AskToDeleteJob = 'ask-to-delete-job',
  InitResults = 'init-results',
  UploadConf = 'upload-conf',
  EnableEdit = 'enable-edit',
  Rename = 'rename',
  ClearResults = 'clear-results',
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
      payload: { pid: number; modal: boolean }
    }
  | {
      command: CommandFromResultsWebview.RunScript
      payload: JobNameMap
    }
  | {
      command: CommandFromResultsWebview.OpenSettings
      payload: JobNameMap
    }
  | {
      command: CommandFromResultsWebview.GetOutput
      payload: string
    }
  | {
      command: CommandFromResultsWebview.ClearResults
      payload: string
    }
  | {
      command: CommandFromResultsWebview.EditConfFile
      payload: JobNameMap
    }
  | {
      command: CommandFromResultsWebview.EnableEdit
      payload: JobNameMap
    }
  | {
      command: CommandFromResultsWebview.DeleteConfFile
      payload: JobNameMap
    }
  | {
      command: CommandFromResultsWebview.AskToDeleteJob
      payload: JobNameMap
    }
  | {
      command: CommandFromResultsWebview.InitResults
    }
  | {
      command: CommandFromResultsWebview.Duplicate
      payload: {
        toDuplicate: JobNameMap
        duplicatedName: JobNameMap
        rule: string | undefined
      }
    }
  | {
      command: CommandFromResultsWebview.RemoveScript
      payload: string
    }
  | {
      command: CommandFromResultsWebview.UploadConf
      payload: string
    }
  | {
      command: CommandFromResultsWebview.Rename
      payload: { oldName: JobNameMap; newName: JobNameMap }
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
      payload: { fileType: string; index: number }
    }

export type ConfFile = {
  files?: string[]
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

export type ConfToCreate = {
  confPath: string
  allowRun: number
  workspaceFolder: string
}

// wip: recursive object for a dir?
export type DirObj = {
  path: string
  runs: ConfToCreate[]
  children: DirObj[]
}
