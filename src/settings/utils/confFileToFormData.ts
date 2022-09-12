import type {
  ConfFile,
  FileFormat,
  NewForm,
  SolidityObj,
  SolidityPackageDir,
  SpecObj,
} from '../types'

const newForm: NewForm = {
  solidyObj: {
    mainFile: { value: '', label: '', path: '' },
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
    specFile: { value: '', label: '', path: '' },
    rules: '',
    duration: '',
    inherit: '',
    optimisticLoop: false,
    loopUnroll: '',
    properties: [],
    runOnStg: false,
    branchName: '',
    localTypeChecking: false,
    shortOutput: false,
    multiAssert: false,
  },
  verificatoinMessage: '',
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
  'short_output',
  'disableLocalTypeChecking',
  'optimistic_loop',
  'packages_path',
  'solc_map',
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
    const index = solc.lastIndexOf('/')
    solidityObj.compiler.exe = solc.slice(0, index)
    solidityObj.compiler.ver = solc.slice(index + 1, solc.length)
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
    const packageArray = packageStr.split('=')
    const tempPackage: SolidityPackageDir = {
      packageName: packageArray[0],
      path: packageArray[1],
    }
    solidityObj.solidityPackageDir.push(tempPackage)
  })
}

function processLink(linkArr: string[], solidityObj: SolidityObj) {
  linkArr.forEach(link => {
    const linkArr = link.split(/[:=]/)
    if (linkArr.length === 3 && linkArr[0] === solidityObj.mainContract) {
      solidityObj.linking.push({
        variable: linkArr[1],
        contractName: linkArr[2],
      })
    }
  })
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

  if (confFile.short_output !== undefined) {
    specObj.shortOutput = confFile.short_output as boolean
  }

  if (confFile.disableLocalTypeChecking !== undefined) {
    specObj.localTypeChecking = !confFile.disableLocalTypeChecking as boolean
  }

  if (confFile.staging) {
    specObj.runOnStg = true
    specObj.branchName = confFile.staging as string
  }

  const additionalSettings = getAdditionalSettings(confFile)
  if (Object.keys(additionalSettings)?.length > 0) {
    specObj.properties = Object.keys(additionalSettings).map(key => ({
      name: key as string,
      value: additionalSettings[key].toString(),
    }))
  }
}

function processMainFile(fullPath: string, fileObj: FileFormat) {
  fileObj.value = fullPath
  fileObj.label = fullPath.split('/').reverse()[0]
  fileObj.path = fullPath.replace(fileObj.label, '')
}

export function confFileToFormData(confFile: ConfFile): NewForm {
  const form = newForm as NewForm

  if (Array.isArray(confFile.files) && confFile.files.length > 0) {
    const mainFile = form.solidyObj.mainFile

    mainFile.value = confFile.files[0] as string

    if (mainFile.value.includes(':')) {
      mainFile.value = mainFile.value.split(':')[0]
      form.solidyObj.mainContract = confFile.files[0].split(':')[1]
    }
    processMainFile(mainFile.value, mainFile)
  }

  if (Array.isArray(confFile.verify) && confFile.verify.length === 1) {
    const verifyStr = confFile.verify[0] as string
    const [mainContractName, specFile] = verifyStr.split(':')

    if (mainContractName) {
      form.solidyObj.mainContract = mainContractName
    }
    if (specFile) {
      processMainFile(specFile, form.specObj.specFile)
    }
  }

  processSolidityAttributes(confFile, form.solidyObj)
  processSpecAttributes(confFile, form.specObj)

  if (confFile.msg) {
    form.verificatoinMessage = confFile.msg
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
    const solArr = contractStr.split(':') || []
    if (solArr.length === 2 && index !== 0) {
      // create contract
      const tempForm: SolidityObj = {
        mainFile: { value: '', label: '', path: '' },
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
      tempForm.mainFile.value = solArr[0] || ''
      if (tempForm.mainFile.value) {
        processMainFile(tempForm.mainFile.value, tempForm.mainFile)
      }
      tempForm.mainContract = solArr[1] || ''

      // link
      if (confFile.link && confFile.link.length > 0) {
        processLink(confFile.link, tempForm)
      }

      // solc map:
      if (confFile.solc_map) {
        Object.entries(confFile.solc_map).forEach(([key, value]) => {
          if (key === tempForm.mainContract) {
            processCompiler(value, tempForm)
          } else if (key === form.solidyObj.mainContract) {
            processCompiler(value, form.solidyObj)
          }
        })
      }
      tempFormArr.push(tempForm)
    }
  })
  form.solidityAdditionalContracts = tempFormArr
}
