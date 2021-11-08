<script lang="ts">
  import Setting from './Setting.svelte'
  import VsCodeButton from './VSCodeButton.svelte'

  export let sol: string[]
  export let mainSolidityFile: string = sol[0] || ''

  function refresh() {
    vscode.postMessage({
      command: 'smart-contracts-files-refresh',
    })
  }
</script>

<Setting title="Main Solidity File" description="Pick solidity file">
  <div class="files-dropdown">
    <vscode-dropdown on:change={e => (mainSolidityFile = e.target.value)}>
      {#each sol as file}
        <vscode-option>{file}</vscode-option>
      {/each}
    </vscode-dropdown>
    <VsCodeButton
      isSmall
      title="Update list of contracts"
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

  vscode-dropdown {
    color: black;
  }
</style>
