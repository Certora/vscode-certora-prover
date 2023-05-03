/* ---------------------------------------------------------------------------------------------
 *  Here we declare types and enums
 *-------------------------------------------------------------------------------------------- */

export type AdditionalContract = {
  file: string
  name?: string
}

export type Link = {
  variable: string
  contractName: string
  fieldName?: string
  associatedContractName?: string
}

export type AdditionalSetting = {
  flag: string
  value: string
}

export type Flag = {
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
  runSource: string
}
// change to multiple solidity / spec
export type NewForm = {
  solidityObj: SolidityObj
  specObj: SpecObj
  verificationMessage: string
  solidityAdditionalContracts?: SolidityObj[] // multiple contracts
  checkMyInputs: boolean
}

export enum EventTypesFromExtension {
  SmartContractsFilesUpdated = 'smart-contracts-files-updated',
  EditConfFile = 'edit-conf-file',
  FileChosen = 'file-chosen',
  notifyWebviewAboutUpdates = 'minor-files-change',
  DisableForm = 'disable-form',
  EnableForm = 'enable-form',
}

export enum Source {
  Sol = 'sol',
  Spec = 'spec',
  Msg = 'msg',
}

export type ConfFile = {
  files?: string[]
  verify?: string[] | string
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
      payload: {
        sol: FileFormat[]
        spec: FileFormat[]
      }
    }
  | {
      type: EventTypesFromExtension.EditConfFile
      payload: { confFile: ConfFile; runName: string }
    }
  | {
      type: EventTypesFromExtension.FileChosen
      payload: { file: FileFormat; index: number }
    }
  | {
      type: EventTypesFromExtension.DisableForm
      payload: string
    }
  | {
      type: EventTypesFromExtension.EnableForm
      payload: string
    }
  | {
      type: EventTypesFromExtension.notifyWebviewAboutUpdates
      payload: {
        method: string
        file: FileFormat
      }
    }
