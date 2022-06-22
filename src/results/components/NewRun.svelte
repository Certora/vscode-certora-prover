<script lang="ts">
  export let doRename: boolean = true
  export let editFunc
  export let deleteFunc
  export let namesMap: Map<string, string>
  export let runName: string = ''
  export let renameRun
  export let deplicateFunc
  //add duplicate function
  let doRun = false
  let beforeRename = ''

  function onKeyPress(e: any) {
    console.log('===somekey===')
    if (e.key === 'Enter') {
      doRename = false
      console.log('===enter===' + e.currentTarget.value)
      if (e.currentTarget.value === '') {
        runName = 'untitled'
        titleHandle()
      }
      if (spacesToUnderscores(e.currentTarget.value) !== beforeRename) {
        namesMap.delete(beforeRename)
      }
      renameRun(beforeRename, spacesToUnderscores(e.currentTarget.value))
    }
  }

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

  function titleHandle() {
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
  }

  function rename() {
    console.log('===rename===')
    doRename = true
    beforeRename = runName
  }

  function duplicate() {
    let duplicatedName = duplicateName()
    let duplicatedRun = { id: 0, name: spacesToUnderscores(duplicatedName) }
    namesMap.set(spacesToUnderscores(duplicatedName), duplicatedName)
    deplicateFunc(duplicatedRun)
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
      <button on:click={rename}>rename</button>
      <button on:click={editFunc}>edit</button>
      <button on:click={deleteFunc}>delete</button>
      <button on:click={duplicate}>duplicate</button>
      {#if doRun}
        <button>RUN</button>
      {/if}
    </div>
  {/if}
</div>
