<script lang="ts">
  /* ---------------------------------------------------------------------------------------------
   *  Component that shows icon of a tree item
   *-------------------------------------------------------------------------------------------- */

  import { getIconPath } from '../utils/getIconPath'

  export let path: string = ''
  export let codicon: string = ''
  export let duplicateFunc = null
  export let hover: string = ''

  $: fullPath = path && getIconPath(path)

  function getHoverClass() {
    if (hover === '') {
      return ''
    }
    return 'disappear-already'
  }
</script>

{#if codicon}
  <div class="icon codicon {codicon}" />
{:else if fullPath}
  <div class="icon">
    <img class={getHoverClass()} src={getIconPath(path)} alt="" />
    {#if hover}
      <img
        class="hiddenIcon"
        title="Rerun rule in new job"
        alt=""
        src={getIconPath(hover)}
        on:click|stopPropagation={duplicateFunc ? duplicateFunc : null}
      />
    {/if}
  </div>
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
    background-repeat: no-repeat !important;
    background-size: 16px;
    -webkit-font-smoothing: antialiased;
  }

  .icon .hiddenIcon {
    display: none;
    position: absolute;
  }

  .icon:hover .hiddenIcon {
    display: flex !important;
    cursor: pointer;
    border-radius: 20px;
    border: 0px solid rgb(184 184 184 / 31%);
    background: var(--foreground);
  }

  .icon:hover .disappear-already {
    display: none;
  }
</style>
