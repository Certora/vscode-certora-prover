import type { SourceVariable, ResultVariable, JumpToDefinition } from '../types'

export function variablesAdapter(
  sourceVariable: SourceVariable,
): ResultVariable {
  const resultVariable: ResultVariable = {
    name: '',
    value: '',
    jumpToDefinition: [],
  }

  Object.keys(sourceVariable).forEach(key => {
    if (key === 'jumpToDefinition') {
      resultVariable.jumpToDefinition =
        sourceVariable.jumpToDefinition as JumpToDefinition[]
    } else {
      resultVariable.name = key
      resultVariable.value = sourceVariable[key] as string | boolean
    }
  })

  return resultVariable
}
