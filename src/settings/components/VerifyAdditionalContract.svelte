<script lang="ts">
  import Setting from './Setting.svelte'
  import LinkButton from './LinkButton.svelte'
  import AdditionalContract from './AdditionalContract.svelte'
  import VsCodeButton from './VSCodeButton.svelte'
  import type { AdditionalContract as AdditionalContractType } from '../types'

  export let sol: string[]
  export let useAdditionalContracts: boolean
  export let additionalContracts: AdditionalContractType[]

  $: showedAdditionalContracts =
    sol.length > 4 ? sol.filter((_, i) => i <= 3) : sol

  function refresh() {
    vscode.postMessage({
      command: 'smart-contracts-files-refresh',
    })
  }
</script>

<Setting title="Verify additional contract" description="Pick Solidity file(s)">
  <div class="additional-contracts">
    <vscode-checkbox
      on:change={e => (useAdditionalContracts = e.target.checked)}
    >
      Use additional contract(s)
    </vscode-checkbox>
    {#if useAdditionalContracts}
      {#each showedAdditionalContracts as file}
        <AdditionalContract
          {file}
          bind:selectedContracts={additionalContracts}
        />
      {/each}
      {#if sol.length > 4 && showedAdditionalContracts.length === 4}
        <LinkButton
          title="Show more contracts"
          icon="chevron-down"
          on:click={() => (showedAdditionalContracts = sol)}
        />
      {/if}
      <VsCodeButton
        title="Update list of contracts"
        icon="refresh"
        isSmall
        on:click={refresh}
      />
    {/if}
  </div>
</Setting>

<style>
  .additional-contracts {
    display: flex;
    flex-direction: column;
    align-items: flex-start;
    gap: 18px;
  }
</style>
