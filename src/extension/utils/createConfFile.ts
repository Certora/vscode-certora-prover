/* ---------------------------------------------------------------------------------------------
 *  Creates a conf file from an inputFormData type.
 *-------------------------------------------------------------------------------------------- */

import { workspace, Uri, window } from 'vscode'
import { log, Sources } from './log'
import { CONF_DIRECTORY_NAME, NewForm, SolidityObj } from '../types'

type ConfFile = {
  files?: string[]
  verify?: string[]
  solc?: string
  link?: string[]
  settings?: string[]
  staging?: string
  cache?: string
  msg?: string
  packages?: string[]
  solc_args?: string[]
  solc_map?: any
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
 * @param solcObj where the data from the user is stored
 */
function additionalContractsSolc(config: ConfFile, solcObj: SolidityObj[]) {
  const findSimilar = solcObj.every(sm => {
    return (
      sm.compiler.ver + sm.compiler.exe === config.solc ||
      sm.compiler.ver + '/' + sm.compiler.exe === config.solc
    )
  })
  if (!findSimilar) {
    delete config.solc
    // object with contracts as keys and solc versions as values
    config.solc_map = {}
    solcObj.forEach(singleSolcObj => {
      const singleSolc = singleSolcObj.compiler.exe
        ? singleSolcObj.compiler.exe + '/' + singleSolcObj.compiler.ver
        : singleSolcObj.compiler.ver
      const contract = singleSolcObj.mainContract
      config.solc_map[contract] = singleSolc
    })
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
  config: ConfFile,
) {
  solidityAdditionalContracts.forEach(contract => {
    config.files?.push(
      `${contract.mainFile.value}${
        contract.mainContract ? `:${contract.mainContract}` : ''
      }`,
    )
    processLinking(contract, config)
  })
  additionalContractsSolc(config, solidityAdditionalContracts)
}

/**
 * translate information about links between forms
 * @param solidityObj translate from
 * @param config translate to
 */
function processLinking(solidityObj: SolidityObj, config: ConfFile) {
  const linking = solidityObj.linking
  const contractName = solidityObj.mainContract
  if (linking.length > 0) {
    if (!config.link) {
      config.link = []
    }
    linking.forEach(link => {
      if (link.variable && link.contractName) {
        config.link?.push(
          `${contractName}:${link.variable}=${link.contractName}`,
        )
      }
    })
    if (config.link.length === 0) {
      delete config.link
    }
  }
}

export function newFormToConf(newForm: NewForm): string {
  const config: ConfFile = {}
  if (!Array.isArray(config.files)) config.files = []

  if (newForm.specObj.specFile && newForm.solidityObj.mainContract) {
    config.verify = [
      `${newForm.solidityObj.mainContract}:${newForm.specObj.specFile.value}`,
    ]
  }

  if (newForm.solidityObj.mainFile) {
    if (newForm.solidityObj.mainContract) {
      config.files.push(
        `${newForm.solidityObj.mainFile.value}:${newForm.solidityObj.mainContract}`,
      )
    } else {
      config.files.push(newForm.solidityObj.mainFile.value)
    }
  }

  const solc = processCompilerPath(
    newForm.solidityObj.compiler.ver,
    newForm.solidityObj.compiler.exe,
  )

  config.solc = solc

  if (
    newForm.solidityAdditionalContracts &&
    newForm.solidityAdditionalContracts.length > 0
  ) {
    processAdditionalContracts(newForm.solidityAdditionalContracts, config)
  }

  const solcArgs = newForm.solidityObj.solidityArgs
  if (solcArgs) {
    const strSolcArgs: string[] = []
    solcArgs.forEach(arg => {
      if (arg.key && arg.value) {
        strSolcArgs.push('--' + arg.key, arg.value)
      } else if (arg.key) {
        strSolcArgs.push('--' + arg.key)
      }
    })
    if (strSolcArgs) {
      config.solc_args = strSolcArgs
    }
  }

  const solDir = newForm.solidityObj.solidityPackageDir
  if (solDir && solDir.length > 0) {
    const packages: string[] = []
    solDir.forEach(pack => {
      if (pack.packageName && pack.path) {
        packages.push(pack.packageName + '=' + pack.path)
      }
    })
    if (packages.length > 0) {
      config.packages = packages
    }
  }
  processLinking(newForm.solidityObj, config)

  if (newForm.specObj.runOnStg) {
    config.staging = newForm.specObj.branchName || 'master'
  }
  if (newForm.specObj.branchName && !newForm.specObj.runOnStg) {
    config.cloud = newForm.specObj.branchName
  }

  if (newForm.verificationMessage) {
    config.msg = newForm.verificationMessage
  }

  if (newForm.specObj.optimisticLoop) {
    config.optimistic_loop = setAdditionalSetting(
      newForm.specObj.optimisticLoop.toString(),
    )
  }

  if (newForm.specObj.multiAssert) {
    config.multi_assert_check = setAdditionalSetting(
      newForm.specObj.multiAssert.toString(),
    )
  }

  if (newForm.specObj.sendOnly) {
    config.send_only = setAdditionalSetting(newForm.specObj.sendOnly.toString())
  }

  if (newForm.specObj.duration) {
    config.smt_timeout = setAdditionalSetting(newForm.specObj.duration)
  }

  if (newForm.specObj.loopUnroll) {
    config.loop_iter = setAdditionalSetting(newForm.specObj.loopUnroll)
  }

  if (newForm.specObj.localTypeChecking) {
    config.disableLocalTypeChecking = setAdditionalSetting(
      (!newForm.specObj.localTypeChecking).toString(),
    )
  }

  if (newForm.solidityObj.solidityPackageDefaultPath) {
    config.packages_path = setAdditionalSetting(
      newForm.solidityObj.solidityPackageDefaultPath,
    )
  }

  if (newForm.specObj.rules) {
    const rulesArr = newForm.specObj.rules.trim().split(',')
    config.rule = setAdditionalSetting(rulesArr.toString())
  }

  if (newForm.solidityObj.specifiMethod) {
    config.method = setAdditionalSetting(newForm.solidityObj.specifiMethod)
  }

  if (newForm.specObj.ruleSanity) {
    if (newForm.specObj.advancedSanity) {
      config.rule_sanity = setAdditionalSetting('advanced')
    } else {
      config.rule_sanity = setAdditionalSetting('basic')
    }
  }

  return JSON.stringify(config, null, 2)
}

/**
 * TEMPORARY: translates data between the new form format to the old one
 * @param newForm new format
 * @param confFileName name of the related conf file (string)
 * @returns InputFormData (translated from NewForm)
 */
// export function processForm(
//   newForm: NewForm,
//   confFileName: string,
// ): InputFormData {
//   const compilerDirectory: string = processCompilerPath(
//     newForm.solidityObj.compiler.ver,
//     newForm.solidityObj.compiler.exe,
//   )
//   const mainSolFile = newForm.solidityObj.mainFile?.value || ''
//   const mainSpecFile = newForm.specObj.specFile.value || ''
//   const form: InputFormData = {
//     name: confFileName,
//     mainSolidityFile: mainSolFile,
//     mainContractName: newForm.solidityObj.mainContract,
//     specFile: mainSpecFile,
//     solidityCompiler: compilerDirectory,
//     useAdditionalContracts: false,
//     additionalContracts: [],
//     link: [],
//     extendedSettings: [],
//     useStaging: newForm.specObj.runOnStg,
//     branch: '',
//     cacheName: '',
//     message: confFileName,
//     additionalSettings: [],
//     solc_map: [],
//   }

//   if (
//     newForm.solidityAdditionalContracts &&
//     newForm.solidityAdditionalContracts.length > 0
//   ) {
//     processAdditionalContracts(newForm.solidityAdditionalContracts, form)
//   }

//   if (newForm.verificationMessage as string) {
//     form.message = newForm.verificationMessage as string
//   }

//   addAdditionalSetting(
//     'optimistic_loop',
//     newForm.specObj.optimisticLoop.toString(),
//     form,
//   )

//   addAdditionalSetting(
//     'multi_assert_check',
//     newForm.specObj.multiAssert.toString(),
//     form,
//   )

//   addAdditionalSetting(
//     'send_only',
//     (newForm.specObj.sendOnly as boolean).toString(),
//     form,
//   )

//   addAdditionalSetting('smt_timeout', newForm.specObj.duration, form)

//   addAdditionalSetting('loop_iter', newForm.specObj.loopUnroll, form)

//   addAdditionalSetting(
//     'disableLocalTypeChecking',
//     (!(newForm.specObj.localTypeChecking as boolean)).toString(),
//     form,
//   )

//   if (newForm.specObj.runOnStg) {
//     form.useStaging = true
//     form.branch = newForm.specObj.branchName || 'master'
//   }

//   if (newForm.specObj.branchName && !newForm.specObj.runOnStg) {
//     form.branch = newForm.specObj.branchName || 'production'
//   }

//   addAdditionalSetting(
//     'packages_path',
//     newForm.solidityObj.solidityPackageDefaultPath,
//     form,
//   )

//   if (newForm.specObj.rules) {
//     const rulesArr = newForm.specObj.rules.trim().split(',')
//     form.additionalSettings.push({
//       flag: 'rule',
//       value: rulesArr,
//     })
//   }

//   addAdditionalSetting('method', newForm.solidityObj.specifiMethod, form)

//   if (newForm.specObj.ruleSanity) {
//     if (newForm.specObj.advancedSanity) {
//       addAdditionalSetting('rule_sanity', 'advanced', form)
//     } else {
//       addAdditionalSetting('rule_sanity', 'basic', form)
//     }
//   }

//   addSolcArguments('solc_args', newForm.solidityObj.solidityArgs, form)

//   processPackages(newForm.solidityObj, form)

//   const additionalSettings = newForm.specObj.properties
//   if (
//     additionalSettings &&
//     additionalSettings.length > 0 &&
//     additionalSettings[0].name
//   ) {
//     additionalSettings.forEach(flag => {
//       addAdditionalSetting(flag.name, flag.value || 'true', form)
//     })
//   }
//   processLink(form, newForm.solidityObj, newForm.solidityObj.mainContract)
//   return form
// }

export async function createConfFile(
  formData: NewForm,
  confFileName: string,
): Promise<void> {
  try {
    const basePath = workspace.workspaceFolders?.[0]

    if (!basePath) return

    const encoder = new TextEncoder()
    const convertedData = newFormToConf(formData)
    const content = encoder.encode(convertedData)
    const path = Uri.joinPath(
      basePath.uri,
      CONF_DIRECTORY_NAME,
      `${confFileName}.conf`,
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
