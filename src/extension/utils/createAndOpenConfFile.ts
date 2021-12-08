import { workspace, Uri, window } from 'vscode'

export type AdditionalContract = {
  file: string
  name?: string
}

export type Link = {
  id: string
  contractName: string
  fieldName: string
  associatedContractName: string
}

export type AdditionalSetting = {
  id: string
  option: string
  value: string
}

export type Flag = {
  id: string
  flag: string
}

export type Form = {
  mainSolidityFile: string
  mainContractName: string
  specFile: string
  solidityCompiler: string
  useAdditionalContracts: boolean
  additionalContracts: AdditionalContract[]
  link: Link[]
  extendedSettings: Flag[]
  useStaging: boolean
  branch: string
  cacheName: string
  message: string
  additionalSettings: AdditionalSetting[]
}

function convertSourceForm(form: Form): string {
  const config: Record<string, any> = {
    files: [],
  }

  if (form.specFile && form.mainContractName) {
    config.verify = [`${form.mainContractName}:${form.specFile}`]
  }

  if (form.mainSolidityFile) {
    config.files.push(form.mainSolidityFile)
  }

  if (form.useAdditionalContracts && form.additionalContracts?.length > 0) {
    form.additionalContracts.forEach(contract => {
      config.files.push(
        `${contract.file}${contract.name ? `:${contract.name}` : ''}`,
      )
    })
  }

  if (form.solidityCompiler) {
    config.solc = form.solidityCompiler
  }

  if (form.useAdditionalContracts && form.link?.length > 0) {
    config.link = []

    form.link.forEach(group => {
      config.link.push(
        `${group.contractName}:${group.fieldName}=${group.associatedContractName}`,
      )
    })
  }

  if (form.extendedSettings?.filter(f => f.flag !== '').length > 0) {
    config.settings = []

    form.extendedSettings.forEach(({ flag }) => {
      config.settings.push(flag)
    })
  }

  if (form.useStaging) {
    config.staging = form.branch
  }

  if (form.cacheName) {
    config.cache = form.cacheName
  }

  if (form.message) {
    config.msg = form.message
  }

  if (form.additionalSettings?.length) {
    function setValue(val?: string) {
      if (val === 'true' || !val) return true
      if (val === 'false') return false

      return val
    }

    form.additionalSettings.forEach(({ option, value }) => {
      if (option) {
        config[option] = setValue(value)
      }
    })
  }

  return JSON.stringify(
    {
      ...config,
      send_only: true,
    },
    null,
    2,
  )
}

export async function createAndOpenConfFile(form: Form): Promise<void> {
  const basePath = workspace.workspaceFolders?.[0]

  if (!basePath) return

  const encoder = new TextEncoder()
  const content = encoder.encode(convertSourceForm(form))
  const parsedSpecFilePath = form.specFile.split('/')
  const path = Uri.joinPath(
    basePath.uri,
    'conf',
    `${form.mainContractName}.${parsedSpecFilePath[
      parsedSpecFilePath.length - 1
    ].replace('.spec', '')}.conf`,
  )

  await workspace.fs.writeFile(path, content)
  const document = await workspace.openTextDocument(path)
  await window.showTextDocument(document)
}
