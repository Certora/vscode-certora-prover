<script lang="ts">
  export let title: string
  export let description: string = ''
  export let showErrorMsg: boolean = false
</script>

<div>
  <h3 class="title">{title}</h3>
  {#if description}
    <p class="description">{description}</p>
  {/if}
  {#if showErrorMsg}
    <p class="error-msg">This is a mandatory field</p>
  {/if}
  <slot />
</div>

<style>
  .title,
  .description,
  .error-msg {
    margin: 0;
    line-height: 16px;
  }

  .title {
    margin-bottom: var(--space-xs);
    font-size: var(--vscode-font-size);
  }

  .error-msg {
    width: 150px;
    margin-bottom: var(--space-sm);
    background-color: pink;
    color: red;
  }

  .description {
    margin-bottom: var(--space-sm);
  }
</style>
