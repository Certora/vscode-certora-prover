/* ---------------------------------------------------------------------------------------------
 *  Convert conf file to new form type
 *-------------------------------------------------------------------------------------------- */

import type {
  ConfFile,
  NewForm,
  SolidityObj,
  SolidityPackageDir,
  SpecObj,
} from '../types'

const newForm: NewForm = {
  solidityObj: {
    mainFile: '',
    mainContract: '',
    linking: [],
    specifiMethod: '',
    compiler: {
      exe: '',
      ver: '',
    },
    solidityArgs: [],
    solidityPackageDefaultPath: '',
    solidityPackageDir: [],
  },
  specObj: {
    specFile: '',
    rules: '',
    duration: '',
    inherit: '',
    optimisticLoop: false,
    loopUnroll: '',
    properties: [],
    runOnStg: false,
    branchName: 'master',
    ruleSanity: false,
    advancedSanity: false,
    localTypeChecking: false,
    multiAssert: false,
    sendOnly: true,
  },
  verificationMessage: '',
  checkMyInputs: false,
}

const stableFields = [
  'files',
  'verify',
  'solc',
  'link',
  'staging',
  'cache',
  'msg',
  'multi_assert_check',
  'packages',
  'rule',
  'solc_args',
  'smt_timeout',
  'loop_iter',
  'method',
  'disableLocalTypeChecking',
  'optimistic_loop',
  'packages_path',
  'solc_map',
  'rule_sanity',
  'send_only',
]

function getAdditionalSettings(confFile: ConfFile) {
  const copy = { ...confFile }

  stableFields.forEach(field => {
    delete copy[field]
  })

  return copy
}

/**
 * convert solc data from conf file to form
 * @param solc string path to solidity compiler executable
 * @param solidityObj solidity object
 */
function processCompiler(solc: string, solidityObj: SolidityObj) {
  try {
    if (solc.includes('/')) {
      const index = solc.lastIndexOf('/')
      solidityObj.compiler.exe = solc.slice(1, index)
      solidityObj.compiler.ver = solc.slice(index + 1, solc.length)
    } else {
      solidityObj.compiler.ver = solc
    }
  } catch (e) {
    console.log(e, 'INNER ERROR')
  }
}

/**
 * convert packages data from conf file to form
 * @param packages packages in conf file format
 * @param solidityObj solidity object
 */
function processPackages(packages: string[], solidityObj: SolidityObj) {
  try {
    packages.forEach(packageStr => {
      const re = /"/gi
      const packageArray = packageStr.replace(re, '').split(/[:|=]/)
      const tempPackage: SolidityPackageDir = {
        packageName: packageArray[0],
        path: packageArray[1],
      }
      solidityObj.solidityPackageDir.push(tempPackage)
    })
  } catch (e) {
    console.log(e, '[INNER ERROR]')
  }
}

function processLink(linkArr: string[], solidityObj: SolidityObj) {
  try {
    linkArr.forEach(link => {
      // looking for linking format [CurrentContract : Variable = OtherContract]
      const linkArr = link.split(/[:=]/)
      if (linkArr.length === 3 && linkArr[0] === solidityObj.mainContract) {
        solidityObj.linking.push({
          variable: linkArr[1],
          contractName: linkArr[2],
        })
      }
    })
  } catch (e) {
    console.log(e, '[INNER ERROR]')
  }
}

/**
 * convert conf file attributes to solidity object attributes (form)
 * @param confFile conf file
 * @param solidityObj soility object
 */
function processSolidityAttributes(
  confFile: ConfFile,
  solidityObj: SolidityObj,
) {
  if (confFile.solc) {
    processCompiler(confFile.solc, solidityObj)
  }

  if (confFile.link && confFile.link.length > 0) {
    processLink(confFile.link, solidityObj)
  }

  if (confFile.packages) {
    processPackages(confFile.packages, solidityObj)
  }

  if (confFile.solc_args) {
    try {
      const solcArgsArr = confFile.solc_args
        .toString()
        .replace(/[[]']/, '')
        .split(',')
      solcArgsArr.forEach(arg => {
        const tempArg = { key: '', value: '' }
        if (arg.includes('--')) {
          tempArg.key = arg.replace('--', '')
          solidityObj.solidityArgs.push(tempArg)
        } else {
          const index = solidityObj.solidityArgs.length - 1
          solidityObj.solidityArgs[index].value = arg
        }
      })
    } catch (e) {
      console.log(e, '[INNER ERROR]')
    }
  } else {
    solidityObj.solidityArgs.push({ key: '', value: '' })
  }
  if (confFile.method) {
    solidityObj.specifiMethod = confFile.method.toString()
  }
}

/**
 * convert conf file data to spec object
 * @param confFile conf file
 * @param specObj spec object
 */
function processSpecAttributes(confFile: ConfFile, specObj: SpecObj) {
  if (confFile.multi_assert_check) {
    specObj.multiAssert = true
  }

  if (confFile.optimistic_loop) {
    specObj.optimisticLoop = true
  }

  if (confFile.rule) {
    specObj.rules = confFile.rule.toString().replace(/[[]]/, '')
  }

  if (confFile.smt_timeout) {
    specObj.duration = confFile.smt_timeout.toString()
  }

  if (confFile.loop_iter) {
    specObj.loopUnroll = confFile.loop_iter.toString()
  }

  if (confFile.disableLocalTypeChecking !== undefined) {
    specObj.localTypeChecking = !confFile.disableLocalTypeChecking as boolean
  }

  if (confFile.staging) {
    specObj.runOnStg = true
    if (confFile.staging.toString() === 'true') {
      confFile.staging = 'master'
    }
    specObj.branchName = confFile.staging.toString() || 'master'
  }

  if (confFile.rule_sanity) {
    if (
      confFile.rule_sanity === 'basic' ||
      confFile.rule_sanity.toString() === 'true'
    ) {
      specObj.ruleSanity = true
    }
    if (confFile.rule_sanity === 'advanced') {
      specObj.ruleSanity = true
      specObj.advancedSanity = true
    }
    specObj.sendOnly = true
  }

  const additionalSettings = getAdditionalSettings(confFile)
  if (Object.keys(additionalSettings)?.length > 0) {
    specObj.properties = Object.keys(additionalSettings).map(key => ({
      name: key as string,
      value: additionalSettings[key] ? additionalSettings[key].toString() : '',
    }))
  }
}

export function confFileToFormData(confFile: ConfFile): NewForm {
  const form = newForm as NewForm

  if (Array.isArray(confFile.files) && confFile.files.length > 0) {
    form.solidityObj.mainFile = confFile.files[0] as string

    if (form.solidityObj.mainFile.includes(':')) {
      form.solidityObj.mainFile = form.solidityObj.mainFile.split(':')[0]
      form.solidityObj.mainContract = confFile.files[0].split(':')[1]
    }
  }

  if (Array.isArray(confFile.verify) && confFile.verify.length === 1) {
    const verifyStr = confFile.verify[0] as string
    const [mainContractName, specFile] = verifyStr.split(':')

    if (mainContractName) {
      form.solidityObj.mainContract = mainContractName
    }
    if (specFile) {
      const fileArr = specFile.split('/')
      const labelTypeArr = fileArr.reverse()[0].split('.')
      const label = labelTypeArr[0]
      const path = fileArr[0]
      const type = '.' + labelTypeArr[1]
      const fileInFormat = {
        value: specFile,
        label: label,
        path: path,
        type: type,
      }
      form.specObj.specFile = fileInFormat
    }
  }

  processSolidityAttributes(confFile, form.solidityObj)
  processSpecAttributes(confFile, form.specObj)

  if (confFile.msg) {
    form.verificationMessage = confFile.msg
  }

  // additional contracts
  if (confFile.files?.length > 1) {
    processAdditionalContracts(confFile, form)
  }
  return form
}

/**
 * fill additional contracts values from the conf file
 * @param confFile to get values from (solidity file, contract name, compiler, link)
 * @param form to fill additional contract data
 */
function processAdditionalContracts(confFile: ConfFile, form: NewForm): void {
  const tempFormArr: SolidityObj[] = []
  confFile.files.forEach((contractStr, index) => {
    if (index !== 0) {
      // create contract
      const tempForm: SolidityObj = {
        mainFile: '',
        mainContract: '',
        linking: [],
        specifiMethod: '',
        compiler: {
          exe: '',
          ver: '',
        },
        solidityArgs: [],
        solidityPackageDefaultPath: '',
        solidityPackageDir: [],
      }

      tempForm.mainFile = contractStr as string
      if (tempForm.mainFile.includes(':')) {
        tempForm.mainFile = contractStr.split(':')[0]
        tempForm.mainContract = contractStr.split(':')[1]
      }
      // maybe main contract isn't explicitly mentioned
      if (!tempForm.mainContract) {
        console.log('no main contract for', tempForm.mainFile)
        const splittedPathToFile = tempForm.mainFile.split('/')
        console.log(splittedPathToFile, 'splitted file')
        tempForm.mainContract = splittedPathToFile[
          splittedPathToFile.length - 1
        ].replace('.sol', '')
      }
      // link
      if (confFile.link && confFile.link.length > 0) {
        processLink(confFile.link, tempForm)
      }

      // solc map:
      if (confFile.solc_map) {
        Object.entries(confFile.solc_map).forEach(([key, value]) => {
          if (key === tempForm.mainContract) {
            processCompiler(value, tempForm)
          } else if (key === form.solidityObj.mainContract) {
            processCompiler(value, form.solidityObj)
          }
        })
      } else if (confFile.solc) {
        if (confFile.solc.includes('/')) {
          const solcArr = confFile.solc.split('/')
          tempForm.compiler.ver = solcArr.reverse()[0]
          tempForm.compiler.exe = solcArr
            .join('')
            .replace(tempForm.compiler.ver, '')
        } else {
          tempForm.compiler.ver = confFile.solc
        }
      }
      tempFormArr.push(tempForm)
    }
  })
  form.solidityAdditionalContracts = tempFormArr
}
