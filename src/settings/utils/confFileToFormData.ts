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
    optimisticLoop: false,
    loopUnroll: '',
    properties: [],
    runOnStg: false,
    branchName: '',
    ruleSanity: false,
    advancedSanity: false,
    localTypeChecking: false,
    multiAssert: false,
    sendOnly: true,
    runSource: 'VSCODE',
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
  'msg',
  'multi_assert_check',
  'packages',
  'rule',
  'solc_args',
  'smt_timeout',
  'loop_iter',
  'disableLocalTypeChecking',
  'optimistic_loop',
  'packages_path',
  'solc_map',
  'rule_sanity',
  'send_only',
  'run_source',
  'cloud',
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
  if (solc.includes('/')) {
    // const index = solc.lastIndexOf('/')
    // solidityObj.compiler.exe = solc.slice(0, index)
    // solidityObj.compiler.ver = solc.slice(index + 1, solc.length)
    const solcArr = solc.split('/')
    solidityObj.compiler.ver = solcArr.pop()
    solidityObj.compiler.exe = solcArr.join('/')
  } else {
    solidityObj.compiler.ver = solc
  }
}

/**
 * convert packages data from conf file to form
 * @param packages packages in conf file format
 * @param solidityObj solidity object
 */
function processPackages(packages: string[], solidityObj: SolidityObj) {
  packages.forEach(packageStr => {
    const re = /"/gi
    const packageArray = packageStr.replace(re, '').split(/[:|=]/)
    const tempPackage: SolidityPackageDir = {
      packageName: packageArray[0],
      path: packageArray[1],
    }
    solidityObj.solidityPackageDir.push(tempPackage)
  })
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

  if (confFile.link && confFile.link.length) {
    processLink(confFile.link, solidityObj)
  }

  if (confFile.packages) {
    processPackages(confFile.packages as string[], solidityObj)
  }

  if (confFile.solc_args) {
    try {
      const solcArgsArr = confFile.solc_args as unknown as string[]
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
      console.log(e, '[INNER ERROR - solc_args]')
    }
  } else {
    solidityObj.solidityArgs.push({ key: '', value: '' })
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
      confFile.staging = ''
    }
    specObj.branchName = confFile.staging.toString() || ''
  }

  if (confFile.cloud) {
    specObj.branchName = confFile.cloud.toString() || ''
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
    specObj.runSource = 'VSCODE'
  }

  const additionalSettings = getAdditionalSettings(confFile)
  if (Object.keys(additionalSettings)?.length) {
    specObj.properties = Object.keys(additionalSettings).map(key => ({
      name: key as string,
      value: additionalSettings[key] ? additionalSettings[key].toString() : '',
    }))
  }
}

export function confFileToFormData(confFile: ConfFile): NewForm {
  const form = newForm as NewForm

  if (Array.isArray(confFile.files) && confFile.files.length) {
    // look for main contract
    const mainFile = confFile.files.find(file => {
      const contract = getContractNameFromFile(file)
      // verify is either an array or a string
      let mainContract = ''
      if (Array.isArray(confFile.verify)) {
        mainContract = confFile.verify ? confFile.verify[0].split(':')[0] : ''
      } else if (typeof confFile.verify === 'string') {
        mainContract = confFile.verify ? confFile.verify.split(':')[0] : ''
      }

      return contract === mainContract
    })
    if (mainFile) {
      form.solidityObj.mainContract = getContractNameFromFile(mainFile)
      if (mainFile.includes(':')) {
        form.solidityObj.mainFile = mainFile.split(':')[0]
      } else {
        form.solidityObj.mainFile = mainFile
      }
    } else {
      form.solidityObj.mainFile = confFile.files[0] as string
      if (form.solidityObj.mainFile.includes(':')) {
        form.solidityObj.mainFile = form.solidityObj.mainFile.split(':')[0]
        form.solidityObj.mainContract = confFile.files[0].split(':')[1]
      }
    }
  }
  // confFile.verify can either be an array or a string
  let mainContractName, specFile
  if (Array.isArray(confFile.verify) && confFile.verify.length === 1) {
    const verifyStr = confFile.verify[0] as string
    ;[mainContractName, specFile] = verifyStr.split(':')
  } else if (typeof confFile.verify === 'string') {
    const verifyStr = confFile.verify
    ;[mainContractName, specFile] = verifyStr.split(':')
  }

  if (mainContractName) {
    form.solidityObj.mainContract = mainContractName
  }
  if (specFile) {
    const fileArr = specFile.split('/')
    const labelTypeArr = fileArr.pop().split('.')
    const label = labelTypeArr[0]
    const path = fileArr.join('/') || ''
    const type = '.' + labelTypeArr[1]
    const fileInFormat = {
      value: specFile,
      label: label,
      path: path,
      type: type,
    }
    form.specObj.specFile = fileInFormat
  }
  processSolidityAttributes(confFile, form.solidityObj)
  processSpecAttributes(confFile, form.specObj)

  if (confFile.msg) {
    form.verificationMessage = confFile.msg
  }

  // additional contracts
  if (confFile.files && confFile.files.length > 1) {
    processAdditionalContracts(confFile, form)
  }
  return form
}

function getContractNameFromFile(fileStr: string): string {
  const contract = fileStr.includes(':')
    ? fileStr.split(':').pop()
    : fileStr.split('/').pop().replace('.sol', '')
  return contract
}

/**
 * fill additional contracts values from the conf file
 * @param confFile to get values from (solidity file, contract name, compiler, link)
 * @param form to fill additional contract data
 */
function processAdditionalContracts(confFile: ConfFile, form: NewForm): void {
  const tempFormArr: SolidityObj[] = []
  confFile.files?.forEach(contractStr => {
    const mainContract = getContractNameFromFile(contractStr)
    console.log(mainContract, form.solidityObj.mainContract, '========')
    if (mainContract !== form.solidityObj.mainContract) {
      // create contract
      const tempForm: SolidityObj = {
        mainFile: '',
        mainContract: '',
        linking: [],
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
        const contractArr = contractStr.split(':')
        tempForm.mainFile = contractArr[0]
        tempForm.mainContract = contractArr[1]
      }
      // maybe main contract isn't explicitly mentioned
      if (!tempForm.mainContract) {
        const splittedPathToFile = tempForm.mainFile.split('/')
        tempForm.mainContract = splittedPathToFile[
          splittedPathToFile.length - 1
        ].replace('.sol', '')
      }
      // link
      if (confFile.link && confFile.link.length) {
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
        processCompiler(confFile.solc, tempForm)
      }
      tempFormArr.push(tempForm)
    }
  })
  form.solidityAdditionalContracts = tempFormArr
}
