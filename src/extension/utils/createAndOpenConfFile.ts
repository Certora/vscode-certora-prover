import { workspace, Uri, window } from 'vscode'

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

export type InputFormData = {
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

type ConfFile = {
  files?: string[]
  verify?: [string]
  solc?: string
  link?: string[]
  settings?: string[]
  staging?: string
  cache?: string
  msg?: string
  send_only: true
} & Record<string, boolean | string>

function setAdditionalSetting(val?: string) {
  if (val === 'true' || !val) return true
  if (val === 'false') return false

  return val
}

function convertSourceFormDataToConfFileJSON(
  inputFormData: InputFormData,
): string {
  const config: ConfFile = {
    send_only: true,
  }

  if (!Array.isArray(config.files)) config.files = []

  if (inputFormData.specFile && inputFormData.mainContractName) {
    config.verify = [
      `${inputFormData.mainContractName}:${inputFormData.specFile}`,
    ]
  }

  if (inputFormData.mainSolidityFile) {
    config.files.push(inputFormData.mainSolidityFile)
  }

  if (
    inputFormData.useAdditionalContracts &&
    inputFormData.additionalContracts?.length > 0
  ) {
    inputFormData.additionalContracts.forEach(contract => {
      config.files?.push(
        `${contract.file}${contract.name ? `:${contract.name}` : ''}`,
      )
    })
  }

  if (inputFormData.solidityCompiler) {
    config.solc = inputFormData.solidityCompiler
  }

  if (inputFormData.useAdditionalContracts && inputFormData.link?.length > 0) {
    config.link = []

    inputFormData.link.forEach(group => {
      config.link?.push(
        `${group.contractName}:${group.fieldName}=${group.associatedContractName}`,
      )
    })
  }

  if (
    inputFormData.extendedSettings?.filter(({ flag }) => flag !== '').length > 0
  ) {
    config.settings = []

    inputFormData.extendedSettings.forEach(({ flag }) => {
      config.settings?.push(flag)
    })
  }

  if (inputFormData.useStaging) {
    config.staging = inputFormData.branch
  }

  if (inputFormData.cacheName) {
    config.cache = inputFormData.cacheName
  }

  if (inputFormData.message) {
    config.msg = inputFormData.message
  }

  if (inputFormData.additionalSettings?.length) {
    inputFormData.additionalSettings.forEach(({ option, value }) => {
      if (option) {
        config[option] = setAdditionalSetting(value)
      }
    })
  }

  return JSON.stringify(config, null, 2)
}

export async function createAndOpenConfFile(
  formData: InputFormData,
): Promise<void> {
  try {
    const basePath = workspace.workspaceFolders?.[0]

    if (!basePath) return

    const encoder = new TextEncoder()
    const content = encoder.encode(
      convertSourceFormDataToConfFileJSON(formData),
    )
    const parsedSpecFilePath = formData.specFile.split('/')
    const path = Uri.joinPath(
      basePath.uri,
      'conf',
      `${formData.mainContractName}.${parsedSpecFilePath[
        parsedSpecFilePath.length - 1
      ].replace('.spec', '')}.conf`,
    )

    await workspace.fs.writeFile(path, content)
    const document = await workspace.openTextDocument(path)
    await window.showTextDocument(document)
  } catch (e) {
    window.showErrorMessage(`Can't create conf file. Error: ${e}`)
  }
}
