<script lang="ts">
  export let name: string
  export let value: any
  export let jumpToDefinition: any
</script>

<div class="code-item" tabindex="0" role="button" on:click>
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
    font-family: var(--monospace-font);
    font-size: 12px;
    line-height: 18px;
    padding: 6px 0 6px 16px;

    &:hover:not(.selected) {
      background-color: var(--code-item-background-color-hover);
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
