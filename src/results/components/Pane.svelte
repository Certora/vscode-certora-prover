<script lang="ts">
  import Toolbar from './Toolbar.svelte'
  import type { Action } from '../types'

  export let title: string
  export let actions: Action[] = []
  export let initialExpandedState: boolean = false

  let isExpanded = initialExpandedState

  function toggleExpand() {
    isExpanded = !isExpanded
  }
</script>

<div class="pane" class:expanded={isExpanded}>
  <div
    class="pane-header"
    on:click={toggleExpand}
    tabindex="0"
    role="button"
    aria-label={`${title} section`}
    aria-expanded={isExpanded}
  >
    <div
      class="arrow-icon codicon codicon-chevron-{isExpanded ? 'down' : 'right'}"
    />
    <h3 class="title" {title}>{title}</h3>
    <div class="actions">
      <Toolbar {actions} />
    </div>
  </div>
  {#if isExpanded}
    <div class="pane-body">
      <slot />
    </div>
  {/if}
</div>

<style lang="postcss">
  .pane-header {
    position: relative;
    display: flex;
    overflow: hidden;
    height: var(--height);
    box-sizing: border-box;
    align-items: center;
    border-top: 1px solid var(--pane-border-color);
    cursor: pointer;
    font-size: var(--font-size);
    font-weight: 700;
    text-transform: uppercase;

    .arrow-icon {
      margin: 0 2px;
    }

    .title {
      overflow: hidden;
      min-width: 3ch;
      font-size: var(--font-size);
      line-height: var(--height);
      -webkit-margin-after: 0;
      -webkit-margin-before: 0;
      text-overflow: ellipsis;
      white-space: nowrap;
    }

    .actions {
      display: none;
      margin-left: auto;
    }
  }

  .pane {
    --height: 22px;
    --font-size: 11px;

    display: flex;
    overflow: hidden;
    width: 100%;
    height: 100%;
    flex-direction: column;
    user-select: none;

    &:hover .pane-header .actions {
      display: initial;
    }

    &:first-of-type .pane-header {
      border-top: none;
    }
  }

  .pane-body {
    overflow: hidden;
    flex: 1;
  }
</style>
