import type { ConfFile, NewForm } from '../types'

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
    branchName: '',
    localTypeChecking: false,
    shortOutput: false,
    multiAssert: false,
  },
  verificatoinMessage: '',
}

const stableFields = [
  'contracts',
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
]

function getAdditionalSettings(confFile: ConfFile) {
  const copy = { ...confFile }

  stableFields.forEach(field => {
    delete copy[field]
  })

  return copy
}

export function confFileToFormData(confFile: ConfFile): NewForm {
  const form = newForm as NewForm

  if (Array.isArray(confFile.files) && confFile.files.length > 0) {
    form.solidyObj.mainFile = confFile.files[0] as string

    if (form.solidyObj.mainFile.includes(':')) {
      form.solidyObj.mainFile = form.solidyObj.mainFile.split(':')[0]
      form.solidyObj.mainContract = confFile.files[0].split(':')[1]
    }
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
      if (linkArr.length === 3) {
        form.solidyObj.linking.push({
          variable: linkArr[1],
          contractName: linkArr[2],
        })
      }
    })
  }

  if (confFile.multi_assert_check) {
    form.specObj.multiAssert = true
  }

  if (confFile.optimistic_loop) {
    form.specObj.optimisticLoop = true
  }

  if (confFile.packages) {
    let jsonPackages = {}
    if (typeof confFile.packages === 'string') {
      jsonPackages = JSON.parse(confFile.packages.toString())
    } else if (typeof confFile.packages === 'object') {
      jsonPackages = confFile.packages
    }
    Object.entries(jsonPackages).forEach(key => {
      const packArray = key.toString().split(',')
      const tempPackage = {
        packageName: packArray[0].toString(),
        path: packArray[1].toString(),
      }
      form.solidyObj.solidityPackageDir.push(tempPackage)
    })
  }

  if (confFile.rule) {
    form.specObj.rules = (confFile.rule as string).replace(' ', ',')
  }

  if (confFile.solc_args) {
    form.solidyObj.solidityArgument = confFile.solc_args.toString()
  }

  if (confFile.smt_timeout) {
    form.specObj.duration = confFile.smt_timeout.toString()
  }

  if (confFile.loop_iter) {
    form.specObj.loopUnroll = confFile.loop_iter.toString()
  }

  if (confFile.method) {
    form.solidyObj.specifiMethod = confFile.method.toString()
  }

  if (confFile.short_output !== undefined) {
    form.specObj.shortOutput = confFile.short_output as boolean
  }

  if (confFile.disableLocalTypeChecking !== undefined) {
    form.specObj.localTypeChecking =
      !confFile.disableLocalTypeChecking as boolean
  }

  if (confFile.msg) {
    form.verificatoinMessage = confFile.msg
  }

  if (confFile.staging) {
    form.specObj.runOnStg = true
    form.specObj.branchName = confFile.staging as string
  }

  const additionalSettings = getAdditionalSettings(confFile)

  if (Object.keys(additionalSettings).length > 0) {
    form.specObj.properties = Object.keys(additionalSettings).map(key => ({
      name: key as string,
      value: additionalSettings[key].toString(),
    }))
  }

  return form
}
