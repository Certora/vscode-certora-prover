<script lang="ts">
  import { getIconPath } from '../getIconPath'

  export let path: string = ''
  export let codicon: string = ''

  $: fullPath = path && getIconPath(path)
</script>

{#if codicon}
  <div class="icon codicon {codicon}" />
{:else if fullPath}
  <div class="icon" style="background-image: url({fullPath})" />
{/if}

<style lang="postcss">
  .icon {
    background-size: 16px;
    background-position: 0;
    background-repeat: no-repeat;
    padding-right: 6px;
    width: 16px;
    height: 22px;
    display: flex !important;
    align-items: center;
    justify-content: center;
    -webkit-font-smoothing: antialiased;
  }
</style>
