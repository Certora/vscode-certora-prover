<script lang="ts">
  export let title: string
  export let description: string = ''
  export let mandatory: boolean = false
  const mandatorySimbol: string = '*'
</script>

<div>
  <h3 class="title">
    {title}
    {#if mandatory}
      <span class="mandatory">{mandatorySimbol}</span>
    {/if}
  </h3>
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
    margin-bottom: var(--space-xs);
    font-size: var(--vscode-font-size);
  }

  .mandatory {
    color: red;
  }

  .description {
    margin-bottom: var(--space-sm);
  }
</style>
