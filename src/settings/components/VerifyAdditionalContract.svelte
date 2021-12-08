<script lang="ts">
  import BaseSetting from './BaseSetting.svelte'
  import LinkButton from './LinkButton.svelte'
  import AdditionalContract from './AdditionalContract.svelte'
  import VsCodeButton from './VSCodeButton.svelte'
  import { refreshFiles } from '../utils/refreshFiles'
  import type { AdditionalContract as AdditionalContractType } from '../types'

  export let solidityFiles: string[]
  export let useAdditionalContracts: boolean
  export let additionalContracts: AdditionalContractType[]

  const visibleContractsCount = 4

  $: showedAdditionalContracts =
    solidityFiles.length > visibleContractsCount
      ? solidityFiles.filter((_, i) => i < visibleContractsCount)
      : solidityFiles
</script>

<BaseSetting
  title="Verify Additional Contract"
  description="Pick solidity file(s)"
>
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
      {#if solidityFiles.length > visibleContractsCount && showedAdditionalContracts.length === visibleContractsCount}
        <LinkButton
          title="Show more contracts"
          icon="chevron-down"
          on:click={() => (showedAdditionalContracts = solidityFiles)}
        />
      {/if}
      <VsCodeButton
        title="Update list of contracts"
        icon="refresh"
        isSmall
        on:click={refreshFiles}
      />
    {/if}
  </div>
</BaseSetting>

<style>
  .additional-contracts {
    display: flex;
    flex-direction: column;
    align-items: flex-start;
    gap: var(--space-lg);
  }
</style>
