<script lang="ts">
  import LinkButton from './LinkButton.svelte'
  import type { Link } from '../types'

  export let showDeleteButton: boolean = false
  export let group: Link
</script>

<div class="link-group">
  <div class="link-group-fields">
    <vscode-text-field
      value={group.contractName}
      on:change={e => (group.contractName = e.target.value)}
    >
      Contract Name
    </vscode-text-field>
    <vscode-text-field
      value={group.fieldName}
      on:change={e => (group.fieldName = e.target.value)}
    >
      Field Name
    </vscode-text-field>
    <vscode-text-field
      value={group.associatedContractName}
      on:change={e => (group.associatedContractName = e.target.value)}
    >
      Associated Contract Name
    </vscode-text-field>
  </div>
  {#if showDeleteButton}
    <LinkButton title="Delete link" icon="trash" red on:click />
  {/if}
</div>

<style>
  .link-group {
    display: flex;
    flex-direction: column;
    gap: var(--space-md);
  }

  .link-group-fields {
    display: flex;
    flex-wrap: wrap;
    gap: var(--space-md);
  }
</style>
