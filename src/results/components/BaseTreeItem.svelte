<script lang="ts">
  export let hasChildren: boolean
  export let label: string
  export let setSize: number
  export let posInset: number
  export let level: number
  export let isExpanded = false

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
  style="--indent: {indent}"
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
    </div>
  </div>
</div>

<style lang="postcss">
  .tree-item {
    box-sizing: border-box;
    overflow: hidden;
    width: 100%;
    height: 22px;
    line-height: 22px;
    padding-right: 12px;
    padding-left: 0;
    cursor: pointer;
    touch-action: none;
    white-space: nowrap;
    font-size: 13px;

    &:hover:not(&.focused):not(&.selected) {
      background-color: var(--vscode-list-hoverBackground);

      .actions {
        display: initial;
      }
    }

    &:focus,
    &.focused {
      outline: 1px solid var(--vscode-focusBorder);
      outline-offset: -1px;

      .actions {
        display: initial;
      }
    }

    &.selected {
      background-color: var(--vscode-list-inactiveSelectionBackground);

      .actions {
        display: initial;
      }
    }
  }

  .row {
    position: relative;
    display: flex;
    align-items: center;
    height: 100%;
  }

  .indent {
    height: 100%;
    position: absolute;
    top: 0;
    left: 16px;
    pointer-events: none;
    width: var(--indent);
  }

  .twistie {
    display: flex !important;
    font-size: 16px;
    text-align: right;
    align-items: center;
    justify-content: center;
    flex-shrink: 0;
    transform: translateX(3px);
    padding-left: var(--indent);
    padding-right: 6px;
    width: 16px;
    height: 100%;

    &::before {
      border-radius: 20px;
    }
  }

  .contents {
    display: flex;
    height: 22px;
    line-height: 22px;
    flex: 1;
    text-overflow: ellipsis;
    overflow: hidden;
    flex-wrap: nowrap;
    padding-left: 3px;
  }

  .label {
    display: flex;
    text-overflow: ellipsis;
    overflow: hidden;
    flex: 1;
  }

  .label-container {
    min-width: 0;
    overflow: hidden;
    text-overflow: ellipsis;

    &::after {
      content: '';
      display: block;
    }
  }

  .name-container {
    flex: 1;
  }

  .label-name {
    color: inherit;
    white-space: pre;
    text-decoration: none;
  }

  .label-description {
    opacity: 0.7;
    margin-left: 0.5em;
    font-size: 0.9em;
    white-space: pre;
  }

  .actions {
    display: none;
    margin-left: auto;
  }
</style>
