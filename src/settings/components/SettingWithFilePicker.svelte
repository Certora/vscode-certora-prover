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
  let showPlaceholder = true

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
    if (e.currentTarget.value && showPlaceholder) {
      showPlaceholder = false
    }
  }

  onMount(() => {
    // Yes, I know, it is really ugly code, but I couldn't find better solution
    // for update selected value in edit conf file form
    setTimeout(() => {
      const correctValue = file
      file = '' // for re-render
      file = correctValue
      if (correctValue && showPlaceholder) {
        showPlaceholder = false
      }
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
    <vscode-dropdown on:change={onSelect} value={file}>
      {#if showPlaceholder}
        <vscode-option>Choose file</vscode-option>
      {/if}
      {#each filteredFiles as path}
        <vscode-option>{path}</vscode-option>
      {/each}
    </vscode-dropdown>
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

  .files-dropdown vscode-dropdown {
    min-width: 212.3px;
  }

  .files-dropdown vscode-text-field {
    max-width: 212.3px;
  }
</style>
