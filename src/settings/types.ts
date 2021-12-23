export type AdditionalContract = {
  file: string
  name?: string
}

export type Link = {
  id: string
  contractName: string
  fieldName: string
  associatedContractName: string
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

export enum EventTypesFromExtension {
  SmartContractsFilesUpdated = 'smart-contracts-files-updated',
  EditConfFile = 'edit-conf-file',
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
} & Record<string, boolean | string>

export type EventsFromExtension =
  | {
      type: EventTypesFromExtension.SmartContractsFilesUpdated
      payload: { sol: string[]; spec: string[] }
    }
  | {
      type: EventTypesFromExtension.EditConfFile
      payload: ConfFile
    }
