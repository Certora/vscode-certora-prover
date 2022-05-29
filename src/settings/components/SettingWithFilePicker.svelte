<script lang="ts">
  import { onMount } from 'svelte'
  import BaseSetting from './BaseSetting.svelte'
  import VsCodeButton from './VSCodeButton.svelte'
  import { refreshFiles } from '../utils/refreshFiles'

  export let title: string
  export let description: string
  export let refreshButtonTitle: string
  export let files: string[]
  export let file: string = files[0]
  export let mandatory: boolean = false
  let query = ''

  $: sortedFiles = [...files].sort((a, b) =>
    a.toLowerCase().localeCompare(b.toLowerCase()),
  )
  $: filteredFiles = query
    ? sortedFiles.filter(file =>
        file.toLowerCase().includes(query.toLowerCase()),
      )
    : sortedFiles

  function onSelect(
    e: Event & {
      currentTarget: EventTarget & HTMLSelectElement
    },
  ) {
    file = e.currentTarget.value
  }

  onMount(() => {
    // Yes, I know, it is really ugly code, but I couldn't find better solution
    // for update selected value in edit conf file form
    setTimeout(() => {
      const correctValue = file
      file = '' // for re-render
      file = correctValue
    }, 200)
  })
</script>

<BaseSetting {title} {description} {mandatory}>
  <div class="files-dropdown">
    <vscode-text-field
      placeholder="Filter files"
      value={query}
      on:change={e => (query = e.target.value)}
    />
    <select class="vscode-select" on:change={onSelect}>
      <option disabled selected={file === ''}>Choose File</option>
      {#each filteredFiles as path}
        <option selected={file === path}>{path}</option>
      {/each}
    </select>
    <VsCodeButton
      isSmall
      title={refreshButtonTitle}
      icon="refresh"
      on:click={refreshFiles}
    />
  </div>
</BaseSetting>

<style>
  .files-dropdown {
    display: flex;
    flex-direction: column;
    align-items: flex-start;
    gap: var(--space-sm);
  }

  .files-dropdown select {
    min-width: 212.3px;
  }

  .files-dropdown vscode-text-field {
    max-width: 212.3px;
  }

  .vscode-select {
    display: flex;
    height: 25px;
    min-height: 100%;
    box-sizing: border-box;
    align-items: center;
    padding: 0 calc(var(--design-unit) * 2px);
    border: calc(var(--border-width) * 1px) solid var(--dropdown-border);
    background-color: var(--dropdown-background);
    border-radius: calc(var(--corner-radius) * 1px);
    color: var(--dropdown-text-color);
    cursor: pointer;
    font-family: inherit;
    font-size: var(--type-ramp-base-font-size);
    line-height: var(--type-ramp-base-line-height);
  }
</style>
