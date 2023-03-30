/* ---------------------------------------------------------------------------------------------
 *  Creates a conf file from an inputFormData type.
 *-------------------------------------------------------------------------------------------- */

import { workspace, Uri, window } from 'vscode'
import { log, Sources } from './log'
import {
  CONF_DIRECTORY_NAME,
  InputFormData,
  NewForm,
  SolcArg,
  SolidityObj,
} from '../types'

type ConfFile = {
  files?: string[]
  verify?: string[]
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
  const mapRegex = /^{(".+":".+")(,".+":".+")*}/g
  if (mapRegex.exec(val)) {
    return JSON.parse(val)
  }
  // for --settings flags:
  const arrayRegex = /(-(.+)(=(.+))?)(,(-(.+)(=(.+))?))*/g
  if (arrayRegex.exec(val)) {
    val = val.toString()
    const squareBracketsRegex = /(\[|\])+/g
    return val.replace(squareBracketsRegex, '').split(',')
  }
  return val
}

/**
 * handle solidity compiler for multiple contracts:
 * if only the main contract has solc: using [solc] flag
 * if additional contracts have solc filled, but all the solc's are the same - use [solc] flag
 * otherwise, use [solc_map] flag with the different solc's
 * @param config conf file to whrite the solc/solc_map flag to
 * @param inputFormData where the data from the user is stored
 */
function additionalContractsSolc(
  config: ConfFile,
  inputFormData: InputFormData,
) {
  const findSimilar = inputFormData.solc_map.every(sm => {
    return sm.solidityCompiler === inputFormData.solc_map[0].solidityCompiler
  })
  if (findSimilar) {
    config.solc = inputFormData.solc_map[0].solidityCompiler || 'solc'
  } else {
    // object with contracts as keys and solc versions as values
    config.solc_map = JSON.parse(
      JSON.stringify(
        Object.fromEntries(
          inputFormData.solc_map.map(i => [i.contract, i.solidityCompiler]),
        ),
      ),
    )
  }
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
        `${contract.file}${
          contract.contractName ? `:${contract.contractName}` : ''
        }`,
      )
    })
  }
  if (
    inputFormData.useAdditionalContracts &&
    inputFormData.solc_map.length > 1
  ) {
    additionalContractsSolc(config, inputFormData)
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
  if (inputFormData.branch && !inputFormData.useStaging) {
    config.cloud = inputFormData.branch
  }

  if (inputFormData.cacheName) {
    config.cache = inputFormData.cacheName
  }

  if (inputFormData.message) {
    config.msg = inputFormData.message
  }

  if (inputFormData.additionalSettings?.length) {
    inputFormData.additionalSettings.forEach(({ flag, value }) => {
      if (flag) {
        config[flag] = setAdditionalSetting(value as string)
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
      flag: flag,
      value: value,
    })
  }
}

/**
 * add solidity arguments (solc_args) into the conf file.
 * to do this, we nees to create an array with all the solidity argument in the format:
 * ["someFlag", "someOtherFlag", "valueOfOtherflag"]
 * where in the example above, the argument "someFlag" has no value, and the argument "someOtherFlag"
 * has the value "valueOfOtherflag".
 * @param flag strings that has the name of the flag for solidity arguments ("solc_args")
 * @param solcArgs array of solidity arguments in the format: { key:string, value: string }
 * @param form InputFormData to add solc_args to
 */
function addSolcArguments(
  flag: string,
  solcArgs: SolcArg[],
  form: InputFormData,
) {
  if (solcArgs) {
    let strSolcArgs = '['
    solcArgs.forEach(arg => {
      if (arg.key && arg.value) {
        strSolcArgs += '--' + arg.key + ',' + arg.value + ','
      } else if (arg.key) {
        strSolcArgs += '--' + arg.key + ','
      }
    })
    if (strSolcArgs !== '[') {
      strSolcArgs = strSolcArgs.replace(/.$/, ']')
      form.additionalSettings.push({
        flag: flag,
        value: strSolcArgs,
      })
    }
  }
}

/**
 * check validity of full path of the compiler, and return a valid path, or
 * jost the compiler file name if the path to it is not valid
 * @param file compiler file
 * @param pathToFile path to compiler file
 * @returns valid path
 */
function processCompilerPath(file: string, pathToFile?: string): string {
  let compDir: string = pathToFile || ''
  if (compDir !== '' && compDir.split('').reverse()[0] !== '/') {
    compDir += '/'
  }
  // checks if the path given in compDir is valid
  const compDirUri: Uri = Uri.parse(compDir)
  let compilerFullPath = file
  if (compDirUri.path !== '/' && compDirUri.path !== undefined) {
    compilerFullPath = compDirUri.path + file
  }
  return compilerFullPath
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
        file: solObj.mainFile.value?.toString(),
        contractName: solObj.mainContract,
      })

      processLink(form, solObj, solObj.mainContract)

      if (solObj.compiler.ver) {
        const compilerFullPath = processCompilerPath(
          solObj.compiler.ver,
          solObj.compiler.exe,
        )
        form.solc_map.push({
          contract: solObj.mainContract,
          solidityCompiler: compilerFullPath,
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
    const packages: string[] = []
    solDir.forEach(pack => {
      if (pack.packageName && pack.path) {
        packages.push(pack.packageName + '=' + pack.path)
      }
    })
    if (packages.length > 0) {
      form.additionalSettings.push({
        flag: 'packages',
        value: packages,
      })
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
  const compilerDirectory: string = processCompilerPath(
    newForm.solidityObj.compiler.ver,
    newForm.solidityObj.compiler.exe,
  )
  const mainSolFile = newForm.solidityObj.mainFile?.value || ''
  const mainSpecFile = newForm.specObj.specFile.value || ''
  const form: InputFormData = {
    name: confFileName,
    mainSolidityFile: mainSolFile,
    mainContractName: newForm.solidityObj.mainContract,
    specFile: mainSpecFile,
    solidityCompiler: compilerDirectory,
    useAdditionalContracts: false,
    additionalContracts: [],
    link: [],
    extendedSettings: [],
    useStaging: newForm.specObj.runOnStg,
    branch: '',
    cacheName: '',
    message: confFileName,
    additionalSettings: [],
    solc_map: [],
  }

  if (
    newForm.solidityAdditionalContracts &&
    newForm.solidityAdditionalContracts.length > 0
  ) {
    processAdditionalContracts(newForm.solidityAdditionalContracts, form)
  }

  if (newForm.verificationMessage as string) {
    form.message = newForm.verificationMessage as string
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

  addAdditionalSetting(
    'send_only',
    (newForm.specObj.sendOnly as boolean).toString(),
    form,
  )

  addAdditionalSetting(
    'run_source',
    (newForm.specObj.runSource as string).toString(),
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
    form.branch = newForm.specObj.branchName || 'master'
  }

  if (newForm.specObj.branchName && !newForm.specObj.runOnStg) {
    form.branch = newForm.specObj.branchName || 'production'
  }

  addAdditionalSetting(
    'packages_path',
    newForm.solidityObj.solidityPackageDefaultPath,
    form,
  )

  if (newForm.specObj.rules) {
    const rulesArr = newForm.specObj.rules.trim().split(',')
    form.additionalSettings.push({
      flag: 'rule',
      value: rulesArr,
    })
  }

  addAdditionalSetting('method', newForm.solidityObj.specifiMethod, form)

  if (newForm.specObj.ruleSanity) {
    if (newForm.specObj.advancedSanity) {
      addAdditionalSetting('rule_sanity', 'advanced', form)
    } else {
      addAdditionalSetting('rule_sanity', 'basic', form)
    }
  }

  addSolcArguments('solc_args', newForm.solidityObj.solidityArgs, form)

  processPackages(newForm.solidityObj, form)

  const additionalSettings = newForm.specObj.properties
  if (
    additionalSettings &&
    additionalSettings.length > 0 &&
    additionalSettings[0].name
  ) {
    additionalSettings.forEach(flag => {
      addAdditionalSetting(flag.name, flag.value || 'true', form)
    })
  }
  processLink(form, newForm.solidityObj, newForm.solidityObj.mainContract)
  return form
}

export async function createConfFile(formData: InputFormData): Promise<void> {
  try {
    const basePath = workspace.workspaceFolders?.[0]

    if (!basePath) return

    const encoder = new TextEncoder()
    const convertedData = convertSourceFormDataToConfFileJSON(formData)
    const content = encoder.encode(convertedData)
    const path = Uri.joinPath(
      basePath.uri,
      CONF_DIRECTORY_NAME,
      `${formData.name}.conf`,
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
  } catch (e) {
    window.showErrorMessage(`Can't create conf file. Error: ${e}`)
  }
}
