<script lang="ts">
  import Setting from './Setting.svelte'
  import VsCodeButton from './VSCodeButton.svelte'

  export let spec: string[]
  export let specFile: string

  function refresh() {
    vscode.postMessage({
      command: 'smart-contracts-files-refresh',
    })
  }
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
      on:click={refresh}
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
