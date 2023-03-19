/* ---------------------------------------------------------------------------------------------
 *  All validators functions. A validator is for checking if an input is valid,
 *  consists of the relevant characters.
 *-------------------------------------------------------------------------------------------- */

import { solidityObj, solAdditionalContracts } from '../stores/store'

function contractValidators() {
  return function email(value) {
    let objArr = []
    solAdditionalContracts.subscribe(obj => (objArr = obj))
    const contracts = objArr.map(contractObj => {
      return contractObj.mainContract
    })
    contracts.push(solidityObj.mainContract)
    let counter = 0
    contracts.forEach(contractName => {
      if (contractName === value) {
        counter++
      }
    })
    if (counter > 1) {
      return 'Contract name ' + value + ' already exists'
    }
    return (
      !!value.match('^[a-zA-Z0-9_]*$') ||
      'Accepting only alphanumeric characters (including the underscore)*'
    )
  }
}

function emailValidator() {
  return function email(value) {
    return (
      !!value.match('^[a-zA-Z0-9_]*$') ||
      'Accepting only alphanumeric characters (including the underscore)*'
    )
  }
}
function spaceAndDashValidator() {
  return function email(value) {
    return (
      !!value.match('^(($)|[a-zA-Z0-9]+)-{0,1}[_, a-zA-Z0-9]*$') ||
      'Accepting only alphanumeric characters (including underscore, space, dash, comma)*'
    )
  }
}
function messageAndNameValidator() {
  const regex = /^[-_, a-zA-Z0-9()]*$/g
  return function email(value) {
    return (
      !!value.match(regex) ||
      'Accepting only alphanumeric characters (including underscore, space, dash, comma, parentheses)*'
    )
  }
}
function compilerValidator() {
  return function email(value) {
    return (
      !!value.match('^[.a-zA-Z0-9]*$') ||
      'Accepting only alphanumeric characters (including the dot)*'
    )
  }
}
function filePathValidator() {
  return function email(value) {
    return (
      !!value.match('^[-_: a-zA-Z0-9/@.]*$') ||
      'Accepting only alphanumeric characters (including underscore, space, dash, slash)*'
    )
  }
}
function numberValidator() {
  return function email(value) {
    return !!value.match('^[0-9]*$') || 'Accepting numbers Only'
  }
}

export {
  emailValidator,
  spaceAndDashValidator,
  numberValidator,
  compilerValidator,
  filePathValidator,
  messageAndNameValidator,
  contractValidators,
}
// export { emailValidator, requiredValidator }
