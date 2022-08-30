import { workspace, Uri, window } from 'vscode'
import { log, Sources } from '../utils/log'
import { InputFormData, NewForm, SolidityObj } from '../types'

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
  if (
    inputFormData.useAdditionalContracts &&
    inputFormData.solc_map.length > 1
  ) {
    config.solc_map = '{'
    inputFormData.solc_map.forEach(map => {
      config.solc_map +=
        '"' + map.contract + '":"' + map.solidityCompiler + '",'
    })
    config.solc_map = JSON.parse(config.solc_map.replace(/.$/, '}'))
  } else {
    config.solc = inputFormData.solidityCompiler || 'solc'
  }

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
    config.staging = inputFormData.branch || 'master'
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

/**
 * translate 'link' attribute between forms
 * @param form InputFormData
 * @param solObj SilidityObj
 * @param contractName name of the contract that has the link
 */
function processLink(
  form: InputFormData,
  solObj: SolidityObj,
  contractName: string,
) {
  const linking = solObj.linking
  if (linking.length > 0) {
    linking.forEach(link => {
      if (link.variable && link.contractName) {
        form.link.push({
          id: '',
          contractName: contractName,
          fieldName: link.variable,
          associatedContractName: link.contractName,
        })
      }
    })
  }
}

/**
 * add additional setting with flag [flag] and value [value] the the form
 * @param flag flag (string)
 * @param value value (string)
 * @param form to add additional setting to
 */
function addAdditionalSetting(
  flag: string,
  value: string,
  form: InputFormData,
) {
  if (value) {
    form.additionalSettings.push({
      id: flag,
      option: flag,
      value: value,
    })
  }
}

/**
 * add additional contracts information to the [form]
 * @param solidityAdditionalContracts additional contracts to add
 * @param form to add contracts to
 */
function processAdditionalContracts(
  solidityAdditionalContracts: SolidityObj[],
  form: InputFormData,
) {
  form.useAdditionalContracts = true
  form.solc_map.push({
    contract: form.mainContractName,
    solidityCompiler: form.solidityCompiler,
  })

  solidityAdditionalContracts.forEach(solObj => {
    if (solObj.mainContract) {
      form.additionalContracts.push({
        file: solObj.mainFile.value.toString(),
        name: solObj.mainContract,
      })

      processLink(form, solObj, solObj.mainContract)

      if (solObj.compiler.ver) {
        let compDir: string = solObj.compiler.exe
        if (compDir !== '') {
          compDir += '/'
        }
        form.solc_map.push({
          contract: solObj.mainContract,
          solidityCompiler: compDir + solObj.compiler.ver,
        })
      }
    }
  })
}

/**
 * translate information about packages between forms
 * @param solObj translate from
 * @param form translate to
 */
function processPackages(solObj: SolidityObj, form: InputFormData) {
  const solDir = solObj.solidityPackageDir
  if (solDir && solDir.length > 0) {
    let packages = '{'
    solDir.forEach(pack => {
      if (pack.packageName && pack.path) {
        packages += '"' + pack.packageName + '"' + ':"' + pack.path + '"' + ','
      }
    })
    if (packages !== '{') {
      packages = packages.replace(/.$/, '}')
      addAdditionalSetting('packages', packages, form)
    }
  }
}

/**
 * TEMPORARY: translates data between the new form format to the old one
 * @param newForm new format
 * @param confFileName name of the related conf file (string)
 * @returns InputFormData (translated from NewForm)
 */
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
    specFile: newForm.specObj.specFile.value,
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
    solc_map: [],
  }

  if (
    newForm.solidityAdditionalContracts &&
    newForm.solidityAdditionalContracts.length > 0
  ) {
    processAdditionalContracts(newForm.solidityAdditionalContracts, form)
  }

  if (newForm.verificatoinMessage as string) {
    form.message = newForm.verificatoinMessage as string
  }

  addAdditionalSetting(
    'optimistic_loop',
    newForm.specObj.optimisticLoop.toString(),
    form,
  )

  addAdditionalSetting(
    'multi_assert_check',
    newForm.specObj.multiAssert.toString(),
    form,
  )

  addAdditionalSetting('smt_timeout', newForm.specObj.duration, form)

  addAdditionalSetting('loop_iter', newForm.specObj.loopUnroll, form)

  addAdditionalSetting(
    'disableLocalTypeChecking',
    (!(newForm.specObj.localTypeChecking as boolean)).toString(),
    form,
  )

  if (newForm.specObj.runOnStg) {
    form.useStaging = true
    form.branch = newForm.specObj.branchName
  }

  addAdditionalSetting(
    'packages_path',
    newForm.solidyObj.solidityPackageDefaultPath,
    form,
  )

  addAdditionalSetting(
    'rule',
    newForm.specObj.rules.trim().replace(',', ' '),
    form,
  )

  addAdditionalSetting('method', newForm.solidyObj.specifiMethod, form)

  addAdditionalSetting(
    'short_output',
    newForm.specObj.shortOutput.toString(),
    form,
  )

  addAdditionalSetting('solc_args', newForm.solidyObj.solidityArgument, form)

  processPackages(newForm.solidyObj, form)

  const additionalSettings = newForm.specObj.properties
  if (
    additionalSettings &&
    additionalSettings.length > 0 &&
    additionalSettings[0].name
  ) {
    additionalSettings.forEach(flag => {
      addAdditionalSetting(flag.name, flag.value, form)
    })
  }
  processLink(form, newForm.solidyObj, newForm.solidyObj.mainContract)
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
