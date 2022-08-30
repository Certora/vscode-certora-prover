import { writable } from 'svelte/store'

// spec writable arrays
export const writableArray_Spec = writable([])
export const writableArray_Spec_Properties = writable([])
// solidity writable arrays
export const writableArray_Solidity = writable([])
export const writableArray_Solidity_Linking = writable([])
export const writableArray_Solidity_Package_Directories = writable([])

export const solAdditionalContracts = writable([])

// verification message
export const verification_message = writable('')

// test spec files array
export const solFilesArr = writable([])
export const specFilesArr = writable([])

// navigation
export const navState = writable({
  file: 'some string',
  solCheck: {
    checked: true,
    active: true,
  },
  specCheck: {
    checked: false,
    active: false,
  },
  msgCheck: {
    checked: false,
    active: false,
  },
})

// reset nav
// eslint-disable-next-line @typescript-eslint/explicit-module-boundary-types
export function resetNav() {
  navState.update(val => {
    val.solCheck.active = false
    val.specCheck.active = false
    val.msgCheck.active = false
    return val
  })
}
// eslint-disable-next-line @typescript-eslint/explicit-module-boundary-types
export function selectNavMenu(str) {
  resetNav()
  navState.update(val => {
    val[str].active = true
    return val
  })
}

// sadly default mainFile : { value: '', label: '', path: '' }
// has to be an empty string instead or else it renders the input with an empty value
export const solidityObj = writable({
  mainFile: '',
  mainContract: '',
  linking: [{ variable: '', contractName: '' }],
  specifiMethod: '',
  compiler: { exe: '', ver: '' },
  solidityArgs: [
    {
      key: '',
      value: '',
    },
  ],
  solidityPackageDir: [
    {
      packageName: '',
      path: '',
    },
  ],
})

// const linkingObj = {
//     variable:'some string',
//     contractName:'some string'
// }

// const compiler = {
//     exe:'somer string',
//     ver:'some string'
// }

// const solidityPackageDir = {
//     packageName:'some string',
//     path:''
// }

export const specObj = writable({
  specFile: '',
  rules: '',
  duration: '',
  inherit: '',
  optimisticLoop: true,
  loopUnroll: '',
  properties: [
    {
      name: '',
      value: '',
    },
  ],
  runOnStg: false,
  branchName: '',
  localTypeChecking: true,
  shortOutput: true,
  multiAssert: true,
})

// const specProperties = {
//     name: 'some string',
//     value:'some string'
// }
