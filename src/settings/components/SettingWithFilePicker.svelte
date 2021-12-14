<script lang="ts">
  import BaseSetting from './BaseSetting.svelte'
  import VsCodeButton from './VSCodeButton.svelte'
  import { refreshFiles } from '../utils/refreshFiles'

  export let title: string
  export let description: string
  export let refreshButtonTitle: string
  export let files: string[]
  export let file: string = ''

  $: file = file || files[0] // Initial value
  $: sortedFiles = [...files].sort((a, b) =>
    a.toLowerCase().localeCompare(b.toLowerCase()),
  )

  function onSelect(
    e: Event & {
      currentTarget: EventTarget & HTMLSelectElement
    },
  ) {
    file = e.currentTarget.value
  }
</script>

<BaseSetting {title} {description}>
  <div class="files-dropdown">
    <vscode-dropdown on:change={onSelect}>
      {#each sortedFiles as path}
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
</style>
