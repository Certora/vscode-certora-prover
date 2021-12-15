<script lang="ts">
  import { navigateToCode } from '../extension-actions'
  import type { JumpToDefinition } from '../types'

  export let name: string
  export let value: string | boolean
  export let jumpToDefinition: JumpToDefinition[]
</script>

<div
  class="code-item"
  tabindex="0"
  role="button"
  on:click={() => {
    navigateToCode(jumpToDefinition)
  }}
>
  <div class="name">{name}</div>
  <div class="value">{value}</div>
</div>

<style lang="postcss">
  .code-item {
    display: flex;
    flex-flow: wrap;
    align-items: center;
    padding: 6px 0 6px 16px;
    cursor: pointer;
    font-family: var(--monospace-font);
    font-size: 12px;
    gap: 2px;
    line-height: 18px;

    &:hover:not(.selected) {
      background-color: var(--code-item-background-color-hover);
    }
  }

  .name {
    color: var(--code-item-name-color);
  }

  .value {
    padding: 2px;
    background-color: var(--code-item-value-background-color);
    border-radius: 2px;
    color: var(--code-item-value-color);
  }
</style>
