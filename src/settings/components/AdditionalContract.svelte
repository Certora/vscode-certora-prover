<script lang="ts">
  import type { AdditionalContract } from '../types'

  export let file: string
  export let selectedContracts: AdditionalContract[]

  $: contract = selectedContracts.find(c => c.file === file)

  function select() {
    selectedContracts = [...selectedContracts, { file, name: '' }]
  }

  function unselect() {
    selectedContracts = selectedContracts.filter(c => c.file !== file)
  }

  function addContractName(name: string) {
    selectedContracts = selectedContracts.map(c =>
      c.file === file ? { file: c.file, name } : c,
    )
  }
</script>

<div class="additional-contract">
  <vscode-checkbox
    checked={!!contract}
    on:change={e => {
      e.target.checked ? select() : unselect()
    }}
  >
    {file}
  </vscode-checkbox>
  <vscode-text-field
    disabled={!contract}
    value={contract ? contract.name : ''}
    on:change={e => {
      addContractName(e.target.value)
    }}
  >
    Contract Name
  </vscode-text-field>
</div>

<style lang="postcss">
  vscode-checkbox {
    margin: 0;
  }

  .additional-contract {
    position: relative;
    display: flex;
    flex-direction: column;
    align-items: self-start;
    gap: var(--space-sm);

    &::before {
      position: absolute;
      left: -6px;
      width: 2px;
      height: 100%;
      background-color: rgba(204, 204, 204, 0.2);
      content: '';
    }
  }
</style>
