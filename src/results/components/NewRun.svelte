<script lang="ts">
  import type { Run } from '../types'

  export let doRename: boolean = true
  export let editFunc: () => void
  export let deleteFunc: () => void
  export let namesMap: Map<string, string>
  export let runName: string = ''
  export let renameRun: (oldName: string, newName: string) => void
  export let duplicateFunc: (run: Run) => void
  let doRun = false
  let beforeRename = ''
  let activateRunRename = false
  const UNTITLED = 'untitled'

  function onKeyPress(e: any) {
    console.log('===somekey===')
    if (e.key === 'Enter') {
      doRename = false
      console.log('===enter===' + e.currentTarget.value)
      if (e.currentTarget.value === '') {
        runName = UNTITLED
        titleHandle()
      }
      activateRunRename = true
    }
  }

  /**
   * returns a name for a duplicated item
   */
  function duplicateName() {
    let nameToDuplicate = runName
    if (namesMap.has(runName)) {
      nameToDuplicate = namesMap.get(runName)
    }
    let counter = 1
    let currentName = renameDuplicate(nameToDuplicate, counter)
    while (namesMap.has(spacesToUnderscores(currentName))) {
      counter++
      currentName = renameDuplicate(nameToDuplicate, counter)
      console.log('===while===')
    }
    return currentName
  }

  /**
   * process a title so it can become a suitable run name
   * a run name cannot contain spaces in the beginning/end of the name,
   * cannot have multiple spaces in a row, cannot contain special cheracters
   * outside space.
   * run name that only contains illegal characters and spaces will become 'undtitled'
   */
  function titleHandle() {
    runName = runName
      .replace(/[^a-zA-Z0-9 ]/g, '')
      .replace(/ +/g, ' ')
      .trim()
    if (runName === '') {
      runName = UNTITLED
    }
    if (namesMap.has(spacesToUnderscores(runName))) {
      console.log('===already been===')
      runName = duplicateName()
    }
    console.log('===new name===')
    namesMap.set(spacesToUnderscores(runName), runName)
    runName = spacesToUnderscores(runName)
    console.log(namesMap)
  }

  function renameDuplicate(name: string, counter: number) {
    return name + ' (' + counter.toString() + ')'
  }

  function spacesToUnderscores(name: string) {
    return name.replaceAll(' ', '_')
  }

  function onChange(
    e: Event & {
      currentTarget: EventTarget & HTMLInputElement
    },
  ) {
    runName = e.currentTarget.value
    titleHandle()
    if (activateRunRename) {
      activateRunRename = false
      console.log('###old name: ', beforeRename, '###namesMap: ', namesMap)
      renameRun(beforeRename, spacesToUnderscores(runName))
    }
  }

  function setRename() {
    console.log('===rename===')
    doRename = true
    beforeRename = runName
  }

  function duplicate() {
    let duplicatedName = duplicateName()
    let duplicatedRun = { id: 0, name: spacesToUnderscores(duplicatedName) }
    namesMap.set(spacesToUnderscores(duplicatedName), duplicatedName)
    duplicateFunc(duplicatedRun)
  }
</script>

<div class="newRun">
  {#if doRename}
    <input
      value={namesMap.get(runName) || ''}
      on:keypress={onKeyPress}
      on:change={onChange}
    />
  {:else}
    <div>
      {namesMap.get(runName)}
      <button on:click={setRename}>rename</button>
      <button on:click={editFunc}>edit</button>
      <button on:click={deleteFunc}>delete</button>
      <button on:click={duplicate}>duplicate</button>
      {#if doRun}
        <button>RUN</button>
      {/if}
    </div>
  {/if}
</div>
