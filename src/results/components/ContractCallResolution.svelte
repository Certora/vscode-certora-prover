<script lang="ts">
  import { navigateToCode } from '../extension-actions'
  import type { ContractCallResolution } from '../types'

  export let contractCallResolution: ContractCallResolution
</script>

<div
  class="contract-call-resolution"
  tabindex="0"
  role="button"
  on:click={() => {
    navigateToCode(contractCallResolution.caller.jumpToDefinition)
  }}
>
  <div class="caller">{contractCallResolution.caller.name}</div>
  <div class="callee">{contractCallResolution.callee.name}</div>
</div>

<style lang="postcss">
  .contract-call-resolution {
    display: flex;
    flex-direction: column;
    align-items: baseline;
    padding: 6px 0 6px 16px;
    cursor: pointer;
    font-family: var(--monospace-font);
    font-size: 12px;
    gap: 2px;
    line-height: 18px;

    &:hover {
      background-color: var(--code-item-background-color-hover);
    }
  }

  .caller {
    color: var(--code-item-name-color);
  }

  .callee {
    display: inline-block;
    padding: 2px;
    background-color: var(--code-item-value-background-color);
    border-radius: 2px;
    color: var(--code-item-value-color);
  }
</style>
