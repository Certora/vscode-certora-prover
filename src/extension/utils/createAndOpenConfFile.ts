import { workspace, Uri, window } from 'vscode'
import { log, Sources } from '../utils/log'
import { InputFormData, ConfFile } from '../types'

function setAdditionalSetting(val?: string) {
  if (val === 'true' || !val) return true
  if (val === 'false') return false
  if (/^[0-9]+$/.exec(val)) return Number(val)
  const mapRegex = /^{(".+":".+")(,".+":".+")*}/g
  if (mapRegex.exec(val)) {
    return JSON.parse(val)
  }
  // for --settings flags:
  const settingsRegex = /(-(.+)(=(.+))?)(,(-(.+)(=(.+))?))*/g
  if (settingsRegex.exec(val)) {
    const squareBracketsRegex = /(\[|\])+/g
    return val.replace(squareBracketsRegex, '').split(',')
  }
  return val
}

function convertSourceFormDataToConfFileJSON(
  inputFormData: InputFormData,
): string {
  const config: ConfFile = {}
  if (!Array.isArray(config.files)) config.files = []

  if (inputFormData.specFile && inputFormData.mainContractName) {
    config.verify = [
      `${inputFormData.mainContractName}:${inputFormData.specFile}`,
    ]
  }

  if (inputFormData.mainSolidityFile) {
    if (inputFormData.mainContractName) {
      config.files.push(
        `${inputFormData.mainSolidityFile}:${inputFormData.mainContractName}`,
      )
    } else {
      config.files.push(inputFormData.mainSolidityFile)
    }
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
  // either use user input or vscode settings
  // better practice might be not creating the conf file if an input doesn't exists
  config.solc = inputFormData.solidityCompiler || 'solc'

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
    const convertedData = convertSourceFormDataToConfFileJSON(formData)
    const content = encoder.encode(convertedData)
    const parsedSpecFilePath = formData.specFile.split('/')
    const path = Uri.joinPath(
      basePath.uri,
      'conf',
      `${formData.mainContractName}.${parsedSpecFilePath[
        parsedSpecFilePath.length - 1
      ].replace('.spec', '')}.conf`,
    )

    await workspace.fs.writeFile(path, content)
    log({
      action: `Conf file was created`,
      source: Sources.Extension,
      info: {
        path,
        formDataFromSettingsWebview: formData,
        confFileContent: convertedData,
      },
    })
    const document = await workspace.openTextDocument(path)
    await window.showTextDocument(document)
  } catch (e) {
    window.showErrorMessage(`Can't create conf file. Error: ${e}`)
  }
}
