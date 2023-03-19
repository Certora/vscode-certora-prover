/* ---------------------------------------------------------------------------------------------
 *  builds one validator. looks for wrong characters, and sends the findings.
 *-------------------------------------------------------------------------------------------- */

function buildValidator(validators) {
  return function validate(value) {
    if (!validators || validators.length === 0) {
      return { valid: true }
    }

    const failing = validators.find(v => v(value) !== true)

    return {
      valid: !failing,
      message: failing && failing(value),
    }
  }
}

export { buildValidator }
