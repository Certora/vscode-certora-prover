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
  .pane {
    --height: 22px;
    --font-size: 11px;

    overflow: hidden;
    width: 100%;
    height: 100%;
    display: flex;
    flex-direction: column;
    -webkit-user-select: none;

    &:hover .actions {
      display: initial;
    }

    &:first-of-type .pane-header {
      border-top: none;
    }
  }

  .pane-header {
    position: relative;
    height: var(--height);
    font-size: var(--font-size);
    font-weight: 700;
    text-transform: uppercase;
    overflow: hidden;
    display: flex;
    cursor: pointer;
    align-items: center;
    box-sizing: border-box;
    border-top: 1px solid var(--pane-border-color);

    .arrow-icon {
      margin: 0 2px;
    }

    .title {
      white-space: nowrap;
      text-overflow: ellipsis;
      overflow: hidden;
      font-size: var(--font-size);
      min-width: 3ch;
      line-height: var(--height);
      -webkit-margin-before: 0;
      -webkit-margin-after: 0;
    }

    .actions {
      display: none;
      margin-left: auto;
    }
  }

  .pane-body {
    overflow: hidden;
    flex: 1;
  }
</style>
