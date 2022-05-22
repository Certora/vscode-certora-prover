<script lang="ts">
  export let title: string
  export let description: string = ''
  export let mandatory: boolean = false
  const mandatorySimbol: string = '*'
</script>

<div>
  <h3 class="title">{title}</h3>
  {#if mandatory}
    <h3 class="mandatory">{mandatorySimbol}</h3>
  {/if}
  {#if description}
    <p class="description">{description}</p>
  {/if}
  <slot />
</div>

<style>
  .title,
  .description,
  .mandatory {
    margin: 0;
    line-height: 16px;
  }

  .title {
    display: inline-block;
    margin-bottom: var(--space-xs);
    font-size: var(--vscode-font-size);
  }

  .mandatory {
    display: inline-block;
    color: red;
  }

  .description {
    margin-bottom: var(--space-sm);
  }
</style>
