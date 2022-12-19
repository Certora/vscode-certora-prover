<script lang="ts">
  /* ---------------------------------------------------------------------------------------------
   *  Component that shows icon of a tree item
   *-------------------------------------------------------------------------------------------- */

  import { getIconPath } from '../utils/getIconPath'

  export let path: string = ''
  export let codicon: string = ''

  $: fullPath = path && getIconPath(path)
</script>

{#if codicon}
  <div class="icon codicon {codicon}" on:click|preventDefault|stopPropagation />
{:else if fullPath}
  <div
    class="icon"
    style="background-image: url({fullPath});"
    on:click|preventDefault|stopPropagation
  />
{/if}

<style lang="postcss">
  .icon {
    display: flex !important;
    width: 16px;
    height: 22px;
    align-items: center;
    justify-content: center;
    padding-right: 6px;
    background-position: 0;
    background-repeat: no-repeat;
    background-size: 16px;
    -webkit-font-smoothing: antialiased;
  }
</style>
