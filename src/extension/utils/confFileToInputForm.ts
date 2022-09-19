import { nanoid } from 'nanoid'
import type { InputFormData, ConfFile } from '../types'

const emptyForm: InputFormData = {
  mainSolidityFile: '',
  mainContractName: '',
  specFile: '',
  solidityCompiler: '',
  useAdditionalContracts: false,
  additionalContracts: [],
  link: [],
  extendedSettings: [{ id: nanoid(), flag: '' }],
  useStaging: false,
  branch: 'master',
  cacheName: '',
  message: '',
  additionalSettings: [
    {
      id: nanoid(),
      option: '',
      value: '',
    },
  ],
  name: '',
  solc_map: [],
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

export function confFileToFormData(
  confFile: ConfFile,
  name: string,
): InputFormData {
  const form = emptyForm as InputFormData

  form.name = name

  if (Array.isArray(confFile.files) && confFile.files.length > 0) {
    form.mainSolidityFile = confFile.files[0] as string

    if (form.mainSolidityFile.includes(':')) {
      form.mainSolidityFile = form.mainSolidityFile.split(':')[0]
    }

    if (confFile.files.length > 1) {
      const [, ...additional] = confFile.files

      form.useAdditionalContracts = true
      form.additionalContracts = additional.map(contract => {
        const [file, name] = contract.split(':')

        if (file && name) {
          return {
            file,
            name,
          }
        }

        return {
          file: contract,
          name: '',
        }
      })
    }
  }

  if (Array.isArray(confFile.verify) && confFile.verify.length === 1) {
    const verifyStr = confFile.verify[0] as string
    const [mainContractName, specFile] = verifyStr.split(':')

    if (mainContractName) {
      form.mainContractName = mainContractName
    }
    if (specFile) {
      form.specFile = specFile
    }
  }

  if (confFile.solc) {
    form.solidityCompiler = confFile.solc as string
  }

  if (Array.isArray(confFile.link) && confFile.link.length > 0) {
    confFile.link.forEach(link => {
      const linkArr = link.split(/[:=]/)
      if (linkArr.length === 3 && linkArr[0] && linkArr[1] && linkArr[2]) {
        form.link.push({
          id: nanoid(),
          contractName: linkArr[0],
          fieldName: linkArr[1],
          associatedContractName: linkArr[2],
        })
      }
    })
  }

  if (Array.isArray(confFile.settings) && confFile.settings.length > 0) {
    form.extendedSettings = confFile.settings.map((flag: string) => ({
      id: nanoid(),
      flag,
    }))
  }

  if (confFile.staging) {
    form.useStaging = true
    form.branch = (confFile.staging as string) || 'master'
  }

  if (confFile.cache) {
    form.cacheName = confFile.cache as string
  }

  if (confFile.msg) {
    form.message = confFile.msg as string
  }

  const additionalSettings = getAdditionalSettings(confFile)

  if (Object.keys(additionalSettings).length > 0) {
    form.additionalSettings = Object.keys(additionalSettings).map(key => ({
      id: nanoid(),
      option: key as string,
      value: additionalSettings[key].toString(),
    }))
  }

  return form
}
