// import { nanoid } from 'nanoid'
// import type { Form, ConfFile } from '../types'

// const emptyForm: Form = {
//   name: '',
//   mainSolidityFile: '',
//   mainContractName: '',
//   specFile: '',
//   solidityCompiler: '',
//   useAdditionalContracts: false,
//   additionalContracts: [],
//   link: [
//     {
//       id: nanoid(),
//       contractName: '',
//       fieldName: '',
//       associatedContractName: '',
//     },
//   ],
//   extendedSettings: [{ id: nanoid(), flag: '' }],
//   useStaging: false,
//   branch: 'master',
//   cacheName: '',
//   message: '',
//   additionalSettings: [
//     {
//       id: nanoid(),
//       option: '',
//       value: '',
//     },
//   ],
import type { Form, ConfFile, NewForm } from '../types'

// const emptyForm: Form = {
//   mainSolidityFile: '',
//   mainContractName: '',
//   specFile: '',
//   solidityCompiler: '',
//   useAdditionalContracts: false,
//   additionalContracts: [],
//   link: [
//     {
//       id: nanoid(),
//       contractName: '',
//       fieldName: '',
//       associatedContractName: '',
//     },
//   ],
//   extendedSettings: [{ id: nanoid(), flag: '' }],
//   useStaging: true,
//   branch: 'master',
//   cacheName: '',
//   message: '',
//   additionalSettings: [
//     {
//       id: nanoid(),
//       option: '',
//       value: '',
//     },
//   ],
// }

const newForm: NewForm = {
  solidyObj: {
    mainFile: '',
    mainContract: '',
    linking: [],
    specifiMethod: '',
    compiler: {
      exe: '',
      ver: '',
    },
    solidityArgument: '',
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
    branchName: '',
    localTypeChecking: false,
    shortOutput: false,
    multiAssert: false,
  },
}

const stableFields = [
  'files',
  'verify',
  'solc',
  'link',
  'settings',
  'staging',
  'cache',
  'msg',
]

function getAdditionalSettings(confFile: ConfFile) {
  const copy = { ...confFile }

  stableFields.forEach(field => {
    delete copy[field]
  })

  return copy
}

// export function confFileToFormData(confFile: ConfFile, name: string): Form {
//   const form = emptyForm as Form
//   form.name = name
export function confFileToFormData(confFile: ConfFile): NewForm {
  const form = newForm as NewForm

  if (Array.isArray(confFile.files) && confFile.files.length > 0) {
    console.log('conf files content: ', confFile.files)
    form.solidyObj.mainFile = confFile.files[0] as string

    if (form.solidyObj.mainFile.includes(':')) {
      form.solidyObj.mainFile = form.solidyObj.mainFile.split(':')[0]
      form.solidyObj.mainContract = confFile.files[0].split(':')[1]
    }
    // if (confFile.files.length > 1) {
    //   const [, ...additional] = confFile.files

    //   form.useAdditionalContracts = true
    //   form.additionalContracts = additional.map(contract => {
    //     const [file, name] = contract.split(':')

    //     if (file && name) {
    //       return {
    //         file,
    //         name,
    //       }
    //     }

    //     return {
    //       file: contract,
    //       name: '',
    //     }
    //   })
    // }
  }

  if (Array.isArray(confFile.verify) && confFile.verify.length === 1) {
    const verifyStr = confFile.verify[0] as string
    const [mainContractName, specFile] = verifyStr.split(':')

    if (mainContractName) {
      form.solidyObj.mainContract = mainContractName
    }
    if (specFile) {
      form.specObj.specFile = specFile
    }
  }

  if (confFile.solc) {
    if (confFile.solc.includes('/')) {
      const index = confFile.solc.lastIndexOf('/')
      form.solidyObj.compiler.exe = confFile.solc.slice(0, index)
      form.solidyObj.compiler.ver = confFile.solc.slice(
        index + 1,
        confFile.solc.length,
      )
    } else {
      form.solidyObj.compiler.ver = confFile.solc
    }
  }

  if (confFile.link && confFile.link.length > 0) {
    confFile.link.forEach(link => {
      const linkArr = link.split(/[:=]/)
      console.log(linkArr)
      if (linkArr.length === 3) {
        form.solidyObj.linking.push({
          variable: linkArr[1],
          contractName: linkArr[2],
        })
      }
    })
  }

  if (confFile['--multi_assert_check']) {
    form.specObj.multiAssert = true
  }

  if (confFile['--optimistic_loop']) {
    form.specObj.optimisticLoop = true
  }

  if (confFile['--packages']) {
    console.log(
      'packages detected',
      confFile['--packages'],
      'type: ',
      typeof confFile['--packages'],
    )
    let jsonPackages = {}
    if (typeof confFile['--packages'] === 'string') {
      jsonPackages = JSON.parse(confFile['--packages'].toString())
    } else if (typeof confFile['--packages'] === 'object') {
      jsonPackages = confFile['--packages']
    }
    console.log('json packages', jsonPackages)
    Object.entries(jsonPackages).forEach(key => {
      const packArray = key.toString().split(',')
      const tempPackage = {
        packageName: packArray[0].toString(),
        path: packArray[1].toString(),
      }
      form.solidyObj.solidityPackageDir.push(tempPackage)
    })
    console.log(form.solidyObj.solidityPackageDir, 'packageDir after addition')
  }

  if (confFile['--rule']) {
    form.specObj.rules = (confFile['--rule'] as string).replace(' ', ',')
  }

  if (confFile['--solc_args']) {
    form.solidyObj.solidityArgument = confFile['--solc_args'].toString()
  }

  if (confFile['--smt_timeout']) {
    form.specObj.duration = confFile['--smt_timeout'].toString()
  }

  if (confFile['--loop_iter']) {
    form.specObj.loopUnroll = confFile['--loop_iter'].toString()
  }

  if (confFile['--method']) {
    form.solidyObj.specifiMethod = confFile['--method'].toString()
  }

  if (confFile['--short_output'] !== undefined) {
    form.specObj.shortOutput = confFile['--short_output'] as boolean
  }

  if (confFile['--disableLocalTypeChecking'] !== undefined) {
    form.specObj.localTypeChecking = !confFile[
      '--disableLocalTypeChecking'
    ] as boolean
  }
  // if (
  //   form.useAdditionalContracts &&
  //   Array.isArray(confFile.link) &&
  //   confFile.link.length > 0
  // ) {
  //   form.solidyObj.linking = confFile.link.map((linkItem: string) => {
  //     const [contractName, fieldNameAndAssociatedContractName] =
  //       linkItem.split(':')
  //     const [fieldName, associatedContractName] =
  //       fieldNameAndAssociatedContractName.split('=')

  //     return {
  //       id: nanoid(),
  //       contractName,
  //       fieldName,
  //       associatedContractName,
  //     }
  //   })
  // }

  // if (Array.isArray(confFile.settings) && confFile.settings.length > 0) {
  //   form.extendedSettings = confFile.settings.map((flag: string) => ({
  //     id: nanoid(),
  //     flag,
  //   }))
  // }

  if (confFile.staging) {
    form.specObj.runOnStg = true
    form.specObj.branchName = confFile.staging as string
  }

  // if (confFile.cache) {
  //   form.cacheName = confFile.cache as string
  // }

  // if (confFile.msg) {
  //   form.message = confFile.msg as string
  // }

  // const additionalSettings = getAdditionalSettings(confFile)

  // if (Object.keys(additionalSettings).length > 0) {
  //   form.additionalSettings = Object.keys(additionalSettings).map(key => ({
  //     id: nanoid(),
  //     option: key as string,
  //     value: additionalSettings[key].toString(),
  //   }))
  // }

  return form
}
