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
  h3,
  p {
    margin: 0;
  }

  .title {
    margin-bottom: 4px;
    font-weight: bold;
    font-size: 13px;
    line-height: 16px;
  }

  .description {
    margin-bottom: 9px;
    font-size: 13px;
    line-height: 16px;
  }
</style>
