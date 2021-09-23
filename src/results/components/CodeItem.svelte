<script lang="ts">
  export let name: string
  export let value: string
  export let selected: boolean
</script>

<div class="code-item" class:selected tabindex="0" role="button" on:click>
  <div class="name">{name}</div>
  <div class="value">{value}</div>
</div>

<style lang="postcss">
  .code-item {
    display: flex;
    flex-flow: wrap;
    align-items: center;
    gap: 2px;
    cursor: pointer;
    font-family: Consolas, 'Courier New', monospace;
    font-size: 12px;
    line-height: 18px;
    padding: 6px 0 6px 16px;

    &:hover:not(.selected) {
      background-color: var(--code-item-background-color-hover);
    }

    &.selected {
      background-color: var(--code-item-background-color-selected);

      .name,
      .value {
        color: #fff;
      }

      .value {
        background-color: transparent;
      }
    }
  }

  .name {
    color: var(--code-item-name-color);
  }

  .value {
    color: var(--code-item-value-color);
    background-color: var(--code-item-value-background-color);
    padding: 2px;
    border-radius: 2px;
  }
</style>
