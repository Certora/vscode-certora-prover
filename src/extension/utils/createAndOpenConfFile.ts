import { workspace, Uri, window } from 'vscode'
import { log, Sources } from '../utils/log'
import { InputFormData, NewForm } from '../types'

type ConfFile = {
  contracts?: string[]
  verify?: [string]
  solc?: string
  link?: string[]
  settings?: string[]
  staging?: string
  cache?: string
  msg?: string
} & Record<string, boolean | string>

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
  if (!Array.isArray(config.contracts)) config.contracts = []

  if (inputFormData.specFile && inputFormData.mainContractName) {
    config.verify = [
      `${inputFormData.mainContractName}:${inputFormData.specFile}`,
    ]
  }

  if (inputFormData.mainSolidityFile) {
    if (inputFormData.mainContractName) {
      config.contracts.push(
        `${inputFormData.mainSolidityFile}:${inputFormData.mainContractName}`,
      )
    } else {
      config.contracts.push(inputFormData.mainSolidityFile)
    }
  }

  if (
    inputFormData.useAdditionalContracts &&
    inputFormData.additionalContracts?.length > 0
  ) {
    inputFormData.additionalContracts.forEach(contract => {
      config.contracts?.push(
        `${contract.file}${contract.name ? `:${contract.name}` : ''}`,
      )
    })
  }
  // either use user input or vscode settings
  // better practice might be not creating the conf file if an input doesn't exists
  config.solc = inputFormData.solidityCompiler || 'solc'

  if (inputFormData.link?.length > 0) {
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

export function processForm(
  newForm: NewForm,
  confFileName: string,
): InputFormData {
  let compilerDirectory: string = newForm.solidyObj.compiler.exe
  if (compilerDirectory !== '') {
    compilerDirectory += '/'
  }
  const form: InputFormData = {
    name: confFileName,
    mainSolidityFile: newForm.solidyObj.mainFile.value,
    mainContractName: newForm.solidyObj.mainContract,
    specFile: newForm.specObj.specFile,
    solidityCompiler: compilerDirectory + newForm.solidyObj.compiler.ver,
    useAdditionalContracts: false,
    additionalContracts: [],
    link: [],
    extendedSettings: [],
    useStaging: newForm.specObj.runOnStg,
    branch: newForm.specObj.branchName,
    cacheName: '',
    message: '',
    additionalSettings: [],
  }

  console.log('form at the moment: ', form)

  if (
    newForm.solidityAdditionalContracts &&
    newForm.solidityAdditionalContracts.length > 0
  ) {
    console.log('=== additional contracts detected ===')
    form.useAdditionalContracts = true
    newForm.solidityAdditionalContracts.forEach(contract => {
      form.additionalContracts.push({ file: contract.mainContract })
    })
  }

  if (newForm.verificatoinMessage as string) {
    form.message = newForm.verificatoinMessage as string
  }

  form.additionalSettings.push({
    id: 'optimistic_loop',
    option: 'optimistic_loop',
    value: newForm.specObj.optimisticLoop.toString(),
  })

  if (newForm.specObj.multiAssert) {
    form.additionalSettings.push({
      id: 'multi_assert',
      option: 'multi_assert_check',
      value: newForm.specObj.multiAssert.toString(),
    })
  }

  if (newForm.specObj.duration) {
    form.additionalSettings.push({
      id: 'duration',
      option: 'smt_timeout',
      value: newForm.specObj.duration,
    })
  }

  if (newForm.specObj.loopUnroll) {
    form.additionalSettings.push({
      id: 'loop_iter',
      option: 'loop_iter',
      value: newForm.specObj.loopUnroll,
    })
  }

  form.additionalSettings.push({
    id: 'typecheck_only',
    option: 'disableLocalTypeChecking',
    value: (!(newForm.specObj.localTypeChecking as boolean)).toString(),
  })

  if (newForm.specObj.runOnStg) {
    form.useStaging = true
    form.branch = newForm.specObj.branchName
  }

  if (newForm.solidyObj.solidityPackageDefaultPath) {
    form.additionalSettings.push({
      id: 'packages_path',
      option: 'packages_path',
      value: newForm.solidyObj.solidityPackageDefaultPath,
    })
  }

  if (newForm.specObj.rules) {
    const rules = newForm.specObj.rules.trim().replace(',', ' ')
    form.additionalSettings.push({
      id: 'rule',
      option: 'rule',
      value: rules,
    })
  }

  if (newForm.solidyObj.specifiMethod) {
    form.additionalSettings.push({
      id: 'method',
      option: 'method',
      value: newForm.solidyObj.specifiMethod,
    })
  }

  if (newForm.specObj.shortOutput) {
    form.additionalSettings.push({
      id: 'short_output',
      option: 'short_output',
      value: newForm.specObj.shortOutput.toString(),
    })
  }

  const solArag = newForm.solidyObj.solidityArgument
  if (solArag && solArag.startsWith('[') && solArag.endsWith(']')) {
    form.additionalSettings.push({
      id: 'solc_args',
      option: 'solc_args',
      value: solArag,
    })
  }

  const solDir = newForm.solidyObj.solidityPackageDir
  if (solDir && solDir.length > 0 && solDir[0].packageName && solDir[0].path) {
    let packages = '{'
    solDir.forEach(pack => {
      packages += '"' + pack.packageName + '"' + ':"' + pack.path + '"' + ','
    })
    packages = packages.replace(/.$/, '}')
    form.additionalSettings.push({
      id: 'packages',
      option: 'packages',
      value: packages,
    })
  }

  const additionalSettings = newForm.specObj.properties
  if (
    additionalSettings &&
    additionalSettings.length > 0 &&
    additionalSettings[0].name
  ) {
    additionalSettings.forEach(flag => {
      form.additionalSettings.push({
        id: flag.name,
        option: flag.name,
        value: flag.value,
      })
    })
  }

  const linking = newForm.solidyObj.linking
  if (linking.length > 0 && linking[0].variable && linking[0].contractName) {
    linking.forEach(link => {
      form.link.push({
        id: '',
        contractName: form.mainContractName,
        fieldName: link.variable,
        associatedContractName: link.contractName,
      })
    })
  }
  return form
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
    const path = Uri.joinPath(basePath.uri, 'conf', `${formData.name}.conf`)
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
  } catch (e) {
    window.showErrorMessage(`Can't create conf file. Error: ${e}`)
  }
}
