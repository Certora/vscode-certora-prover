<script lang="ts">
  import { nanoid } from 'nanoid'
  import Setting from './Setting.svelte'
  import LinkGroup from './LinkGroup.svelte'
  import VsCodeButton from './VSCodeButton.svelte'
  import type { Link as LinkType } from '../types'

  export let useAdditionalContracts: boolean
  export let link: LinkType[]
</script>

{#if useAdditionalContracts}
  <Setting
    title="Link"
    description="Make a storage field of a Solidity contract point to another contract"
  >
    <div class="link-groups">
      {#each link as group, index (group.id)}
        <LinkGroup
          bind:group
          showDeleteButton={index !== 0}
          on:click={() => (link = link.filter(({ id }) => id !== group.id))}
        />
      {/each}
    </div>
    <VsCodeButton
      title="Add link"
      icon="add"
      isSmall
      on:click={() =>
        (link = [
          ...link,
          {
            id: nanoid(),
            contractName: '',
            fieldName: '',
            associatedContractName: '',
          },
        ])}
    />
  </Setting>
{/if}

<style>
  .link-groups {
    display: flex;
    flex-direction: column;
    align-items: flex-start;
    gap: 18px;
    margin-bottom: 18px;
  }
</style>
