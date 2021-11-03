<script lang="ts">
  import LinkButton from './LinkButton.svelte'
  import type { Link } from '../types'

  export let showDeleteButton: boolean = false
  export let group: Link
</script>

<div class="link">
  <vscode-text-field on:change={e => (group.contractName = e.target.value)}>
    Contract Name
  </vscode-text-field>
  <vscode-text-field on:change={e => (group.fieldName = e.target.value)}>
    Field Name
  </vscode-text-field>
  <vscode-text-field
    on:change={e => (group.associatedContractName = e.target.value)}
  >
    Associated Contract Name
  </vscode-text-field>
  {#if showDeleteButton}
    <LinkButton title="Delete link group" icon="trash" red on:click />
  {/if}
</div>

<style>
  .link {
    position: relative;
    display: flex;
    flex-direction: column;
    align-items: flex-start;
    gap: 14px;
  }

  .link::before {
    position: absolute;
    left: -6px;
    width: 2px;
    height: 100%;
    background-color: rgba(204, 204, 204, 0.2);
    content: '';
  }
</style>
