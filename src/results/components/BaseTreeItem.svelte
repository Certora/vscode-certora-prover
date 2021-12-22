<script lang="ts">
  import Toolbar from './Toolbar.svelte'
  import type { Action } from '../types'

  export let hasChildren: boolean
  export let label: string
  export let setSize: number
  export let posInset: number
  export let level: number
  export let isExpanded = false
  export let actions: Action[] = []

  $: indent = `${level * 8}px`

  let isFocused = false
</script>

<div
  class="tree-item"
  class:focused={isFocused}
  class:selected={isFocused}
  role="treeitem"
  aria-setsize={setSize}
  aria-posinset={posInset}
  aria-selected="false"
  aria-label={label}
  aria-level={level}
  aria-expanded={isExpanded}
  draggable="false"
  tabindex="0"
  title={label}
  style="--indent: {indent};"
  on:click
  on:focus={() => (isFocused = true)}
  on:blur={() => (isFocused = false)}
>
  <div class="row">
    <div class="indent" />
    <div
      class="twistie {hasChildren || level === 1
        ? `codicon codicon-chevron-${isExpanded ? 'down' : 'right'}`
        : ''}"
    />
    <div class="contents">
      <slot />
      <div class="actions">
        <Toolbar {actions} />
      </div>
    </div>
  </div>
</div>

<style lang="postcss">
  .tree-item {
    overflow: hidden;
    width: 100%;
    height: 22px;
    box-sizing: border-box;
    padding-right: 12px;
    padding-left: 0;
    cursor: pointer;
    font-size: 13px;
    line-height: 22px;
    touch-action: none;
    white-space: nowrap;

    .actions {
      display: none;
      margin-left: auto;
    }

    &.focused,
    &:focus {
      outline: 1px solid var(--vscode-focusBorder);
      outline-offset: -1px;
    }

    &.focused,
    &:focus,
    &.selected,
    &:hover:not(&.focused):not(&.selected) {
      .actions {
        display: initial;
      }
    }

    &:hover:not(&.focused):not(&.selected) {
      background-color: var(--vscode-list-hoverBackground);
    }

    &.selected {
      background-color: var(--vscode-list-inactiveSelectionBackground);
    }
  }

  .row {
    position: relative;
    display: flex;
    height: 100%;
    align-items: center;
  }

  .indent {
    position: absolute;
    top: 0;
    left: 16px;
    width: var(--indent);
    height: 100%;
    pointer-events: none;
  }

  .twistie {
    display: flex !important;
    width: 16px;
    height: 100%;
    flex-shrink: 0;
    align-items: center;
    justify-content: center;
    padding-right: 6px;
    padding-left: var(--indent);
    font-size: 16px;
    text-align: right;
    transform: translateX(3px);

    &::before {
      border-radius: 20px;
    }
  }

  .contents {
    display: flex;
    overflow: hidden;
    height: 22px;
    flex: 1;
    flex-wrap: nowrap;
    padding-left: 3px;
    line-height: 22px;
    text-overflow: ellipsis;
  }

  .label {
    display: flex;
    overflow: hidden;
    flex: 1;
    text-overflow: ellipsis;
  }

  .label-container {
    overflow: hidden;
    min-width: 0;
    text-overflow: ellipsis;

    &::after {
      display: block;
      content: '';
    }
  }

  .name-container {
    flex: 1;
  }

  .label-name {
    color: inherit;
    text-decoration: none;
    white-space: pre;
  }

  .label-description {
    margin-left: 0.5em;
    font-size: 0.9em;
    opacity: 0.7;
    white-space: pre;
  }
</style>
