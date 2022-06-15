<script lang="ts">
  export let doRename: boolean = true
  export let editFunc
  export let deleteFunc
  export let namesMap: Map<string, number>
  export let runName: string = ''
  //add duplicate function
  let doRun = false

  function onKeyPress(e: any) {
    if (e.key == 'Enter') {
      doRename = false
    }
  }

  function onChange(
    e: Event & {
      currentTarget: EventTarget & HTMLInputElement
    },
  ) {
    runName = e.currentTarget.value
    if (namesMap.has(runName)) {
      console.log(runName)
    }
  }

  function rename() {
    doRename = true
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
