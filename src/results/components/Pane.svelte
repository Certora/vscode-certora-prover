<script lang="ts">
  import Toolbar from './Toolbar.svelte'

  export let title: string
  export let actions: { title: string; onClick: () => void; icon: string }[] =
    []

  let isExpanded = false

  function toggleExpand() {
    isExpanded = !isExpanded
  }
</script>

<div class="pane {isExpanded ? 'expanded' : ''}">
  <div
    class="pane-header"
    on:click={toggleExpand}
    tabindex="0"
    role="button"
    aria-label={`${title} section`}
    aria-expanded={isExpanded}
  >
    <div
      class="arrow-icon codicon {isExpanded
        ? 'codicon-view-pane-container-expanded'
        : 'codicon-view-pane-container-collapsed'}"
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

    &.expanded:hover .actions {
      display: initial;
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

    .arrow-icon {
      margin: 0 2px;

      &.codicon-view-pane-container-collapsed::before {
        content: '\eab6';
      }

      &.codicon-view-pane-container-expanded::before {
        content: '\eab4';
      }
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
