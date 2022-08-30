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
      !!value.match('^[-_ a-zA-Z0-9/]*$') ||
      'Accepting only alphanumeric characters (including underscore, space, dash, slash)*'
    )
  }
}
function numberValidator() {
  return function email(value) {
    return !!value.match('^[0-9]*$') || 'Accepting numbers Only'
  }
}
//   (value && !!value.match('^[a-zA-Z ]*$')) || 'Please enter a valid email'
// empty string rerurns error here

// looks like a useless  just for msg?
// function requiredValidator() {
//   return function required(value) {
//     return (
//       (value !== undefined && value !== null && value !== '') ||
//       'This field is required'
//     )
//   }
// }

export {
  emailValidator,
  spaceAndDashValidator,
  numberValidator,
  compilerValidator,
  filePathValidator,
}
// export { emailValidator, requiredValidator }
