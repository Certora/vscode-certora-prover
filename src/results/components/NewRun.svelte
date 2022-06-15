<script lang="ts">
  export let doRename: boolean = true
  export let editFunc
  export let deleteFunc
  export let namesMap: Map<string, number>
  export let runName: string = ''
  //add duplicate function
  let doRun = false

  function onKeyPress(e: any) {
    console.log('===somekey===')
    if (e.key === 'Enter') {
      doRename = false
      console.log('===enter===' + e.currentTarget.value)
      if (e.currentTarget.value === '') {
        runName = 'untitled'
        titleHandle()
      }
    }
  }

  function titleHandle() {
    if (namesMap.has(runName)) {
      console.log('===already been===')
      let counter = 1
      let currentName = renameDuplicate(runName, counter)
      while (namesMap.has(currentName)) {
        counter++
        currentName = renameDuplicate(runName, counter)
        console.log('===while===')
      }
      runName = currentName
    }
    console.log('===new name===')
    namesMap.set(runName, 0)
    console.log(namesMap)
  }

  function renameDuplicate(name: string, counter: number) {
    return name + ' (' + counter.toString() + ')'
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
    namesMap.delete(runName)
  }
</script>

<div class="newRun">
  {#if doRename}
    <input value={runName} on:keypress={onKeyPress} on:change={onChange} />
  {:else}
    <div>
      {runName}
      <button on:click={rename}>rename</button>
      <button on:click={editFunc}>edit</button>
      <button on:click={deleteFunc}>delete</button>
      <button>duplicate</button>
      {#if doRun}
        <button>RUN</button>
      {/if}
    </div>
  {/if}
</div>
