/* ---------------------------------------------------------------------------------------------
 *  Creates a conf file from an NewForm data type.
 *-------------------------------------------------------------------------------------------- */

import { workspace, Uri, window } from 'vscode'
import { log, Sources } from './log'
import { CONF_DIRECTORY_NAME, CvlVersion, NewForm, SolidityObj } from '../types'
import { cvlVersion } from '../ScriptRunner'

type ConfFile = {
  files?: string[]
  verify?: string | string[]
  solc?: string
  link?: string[]
  settings?: string[]
  staging?: string
  cache?: string
  msg?: string
  packages?: string[]
  solc_args?: string[]
  solc_map?: any
  rule?: string[]
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
 * @param config conf file to write the solc/solc_map flag to
 * @param solcObj where the data from the user is stored
 */
function additionalContractsSolc(config: ConfFile, solcObj: SolidityObj[]) {
  delete config.solc_map
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
 * just the compiler file name if the path to it is not valid
 * @param file compiler file
 * @param pathToFile path to compiler file
 * @returns valid path
 */
function processCompilerPath(file: string, pathToFile?: string): string {
  let compDir: string = pathToFile || ''
  if (compDir && compDir.split('').pop() !== '/') {
    compDir += '/'
  }
  // checks if the path given in compDir is valid
  try {
    const compDirUri: Uri = Uri.parse(compDir)
    let compilerFullPath = file
    if (compDirUri.path !== '/' && compDirUri.path) {
      compilerFullPath = compDirUri.path + file
    }
    return compilerFullPath
  } catch (e) {
    // if the exe is nonsense
    console.log('[BAD SOLC EXE PATH]', e)
  }
  return file
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
  if (linking.length) {
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
    if (!config.link.length) {
      delete config.link
    }
  }
}

/**
 * from NewForm format to conf file format (settings form to json)
 * @param newForm data in NewForm format
 * @returns data in conf file format (as string)
 */
export function newFormToConf(newForm: NewForm): string {
  const config: ConfFile = {}
  if (!Array.isArray(config.files)) config.files = []

  if (newForm.specObj.specFile && newForm.solidityObj.mainContract) {
    // verify is an array in the old version, string in the new one
    const oldCliVersion = cvlVersion === CvlVersion.cvlVersion1

    if (oldCliVersion) {
      config.verify = [
        `${newForm.solidityObj.mainContract}:${newForm.specObj.specFile.value}`,
      ]
    } else {
      config.verify = `${newForm.solidityObj.mainContract}:${newForm.specObj.specFile.value}`
    }
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
    newForm.solidityAdditionalContracts.length
  ) {
    processAdditionalContracts(newForm.solidityAdditionalContracts, config)
  }

  if (config.solc_map) {
    config.solc_map[newForm.solidityObj.mainContract] = solc
  }

  const solcArgs = newForm.solidityObj.solidityArgs
  if (solcArgs) {
    const strSolcArgs: string[] = []
    solcArgs.forEach(arg => {
      if (arg.key) {
        strSolcArgs.push('--' + arg.key)
      }
      if (arg.value) {
        strSolcArgs.push(arg.value)
      }
    })
    if (strSolcArgs) {
      config.solc_args = strSolcArgs
    }
  }

  const solDir = newForm.solidityObj.solidityPackageDir
  if (solDir && solDir.length) {
    const packages: string[] = []
    solDir.forEach(pack => {
      if (pack.packageName && pack.path) {
        packages.push(pack.packageName + '=' + pack.path)
      }
    })
    if (packages.length) {
      config.packages = packages
    }
  }
  processLinking(newForm.solidityObj, config)

  if (newForm.specObj.runOnStg) {
    config.staging = newForm.specObj.branchName || ''
  }
  if (newForm.specObj.branchName && !newForm.specObj.runOnStg) {
    config.cloud = newForm.specObj.branchName
  }

  if (newForm.verificationMessage) {
    config.msg = newForm.verificationMessage
  }

  if (config.run_source) {
    config.run_source = 'VSCODE'
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
    if (rulesArr.length) {
      config.rule = rulesArr
    }
  }

  if (newForm.specObj.ruleSanity) {
    if (newForm.specObj.advancedSanity) {
      config.rule_sanity = setAdditionalSetting('advanced')
    } else {
      config.rule_sanity = setAdditionalSetting('basic')
    }
  }

  // additional flags
  newForm.specObj.properties.forEach(prop => {
    config[prop.name] = setAdditionalSetting(prop.value)
  })

  return JSON.stringify(config, null, 2)
}

export async function createConfFile(
  formData: NewForm,
  confFileName: string,
): Promise<void> {
  try {
    const basePath = workspace.workspaceFolders?.[0]
    if (!basePath) return
    formData.specObj.properties = formData.specObj.properties.filter(prop => {
      return prop.name !== ''
    })

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
