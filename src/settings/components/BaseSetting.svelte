<script lang="ts">
  export let title: string
  export let description: string = ''
</script>

<div>
  <h3 class="title">{title}</h3>
  {#if description}
    <p class="description">{description}</p>
  {/if}
  <slot />
</div>

<style>
  .title,
  .description {
    margin: 0;
    line-height: 16px;
  }

  .title {
    margin-bottom: var(--space-xs);
    font-size: var(--vscode-font-size);
  }

  .description {
    margin-bottom: var(--space-sm);
  }
</style>
