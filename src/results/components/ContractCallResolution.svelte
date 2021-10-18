<script lang="ts">
  import { navigateToCode } from '../utils/navigateToCode'
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
    gap: 2px;
    cursor: pointer;
    font-family: var(--monospace-font);
    font-size: 12px;
    line-height: 18px;
    padding: 6px 0 6px 16px;

    &:hover {
      background-color: var(--code-item-background-color-hover);
    }
  }

  .caller {
    color: var(--code-item-name-color);
  }

  .callee {
    display: inline-block;
    color: var(--code-item-value-color);
    background-color: var(--code-item-value-background-color);
    padding: 2px;
    border-radius: 2px;
  }
</style>
