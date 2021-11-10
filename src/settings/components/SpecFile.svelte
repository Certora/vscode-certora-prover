<script lang="ts">
  import Setting from './Setting.svelte'
  import VsCodeButton from './VSCodeButton.svelte'
  import { refreshFiles } from '../utils/refreshFiles'

  export let spec: string[]
  export let specFile: string = ''

  $: specFile = specFile || spec[0] // Initial value
</script>

<Setting title="Spec File" description="Spec file path">
  <div class="files-dropdown">
    <vscode-dropdown on:change={e => (specFile = e.target.value)}>
      {#each spec as file}
        <vscode-option>{file}</vscode-option>
      {/each}
    </vscode-dropdown>
    <VsCodeButton
      isSmall
      title="Update list of spec files"
      icon="refresh"
      on:click={refreshFiles}
    />
  </div>
</Setting>

<style>
  .files-dropdown {
    display: flex;
    flex-direction: column;
    align-items: flex-start;
    gap: 9px;
  }
</style>
