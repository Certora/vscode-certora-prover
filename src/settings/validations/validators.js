/* ---------------------------------------------------------------------------------------------
 *  All validators functions. A validator is for checking if an input is valid,
 *  consists of the relvant charecters.
 *-------------------------------------------------------------------------------------------- */

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
      !!value.match('^[-_, a-zA-Z0-9]*$') ||
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
      !!value.match('^[-_ a-zA-Z0-9/@]*$') ||
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
}
// export { emailValidator, requiredValidator }
