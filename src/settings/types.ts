export type AdditionalContract = {
  file: string
  name?: string
}

export type Link = {
  id?: string
  variable: string
  contractName: string
  fieldName?: string
  associatedContractName?: string
}

export type AdditionalSetting = {
  id: string
  option: string
  value: string
}

export type Flag = {
  id: string
  flag: string
}

export type Form = {
  name: string
  mainSolidityFile: string
  mainContractName: string
  specFile: string
  solidityCompiler: string
  useAdditionalContracts: boolean
  additionalContracts: AdditionalContract[]
  link: Link[]
  extendedSettings: Flag[]
  useStaging: boolean
  branch: string
  cacheName: string
  message: string
  additionalSettings: AdditionalSetting[]
}

export type Compiler = {
  exe: string
  ver: string
}

export type SolidityPackageDir = {
  packageName: string
  path: string
}

export type SolcArg = {
  key: string
  value: string
}

// solidity part of the new settings view
export type SolidityObj = {
  mainFile: string
  mainContract: string
  linking: Link[]
  specifiMethod: string
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
// todo: change to multiple solidity / spec
export type NewForm = {
  solidyObj: SolidityObj
  specObj: SpecObj
  verificatoinMessage: string
  solidityAdditionalContracts?: SolidityObj[] // multiple contracts
  checkMyInputs: boolean
}

export enum EventTypesFromExtension {
  SmartContractsFilesUpdated = 'smart-contracts-files-updated',
  EditConfFile = 'edit-conf-file',
  FileChosen = 'file-chosen',
  MinorFilesChange = 'minor-files-change',
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
  solc_map?: JSON
  packages?: string[]
} & Record<string, boolean | string>

export type EventsFromExtension =
  | {
      type: EventTypesFromExtension.SmartContractsFilesUpdated
      payload: { sol: string[]; spec: string[] }
    }
  | {
      type: EventTypesFromExtension.EditConfFile
      payload: [ConfFile, string]
    }
  | {
      type: EventTypesFromExtension.FileChosen
      payload: [string, number]
    }
  | {
      type: EventTypesFromExtension.MinorFilesChange
      payload: {
        method: string
        file: { value: string; label: string; path: string; type: string }
      }
    }
