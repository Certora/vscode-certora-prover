/* ---------------------------------------------------------------------------------------------
 *  creates validators field.
 *-------------------------------------------------------------------------------------------- */

import { writable } from 'svelte/store'
import { buildValidator } from './validate.js'

export function createFieldValidator(...validators) {
  const { subscribe, set } = writable({
    valid: false,
    message: null,
  })
  const validator = buildValidator(validators)

  function action(node, binding) {
    function validate(value) {
      const result = validator(value)
      set(result)
    }

    validate(binding, false)

    return {
      update(value) {
        validate(value, true)
      },
    }
  }

  return [{ subscribe }, action]
}
