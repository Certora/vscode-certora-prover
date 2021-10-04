<script lang="ts">
  import Toolbar from './Toolbar.svelte'
  import { getIconPath } from '../getIconPath'
  import {
    Action,
    RuleTreeItem,
    CallTraceFunction,
    RuleResults,
  } from '../types'

  export let data:
    | {
        type: 'rules'
        item: RuleTreeItem
      }
    | {
        type: 'callstack'
        item: CallTraceFunction
      }
  export let setSize = 1
  export let posinset = 1
  export let actions: Action[] = []
  export let level = 1

  $: hasChildren = Boolean(data.item.childrenList?.length)
  $: statusIcon = getIconPath(
    data.type === 'rules' && data.item.result
      ? `/${data.item.result}-status.svg`
      : `/unknown-status.svg`,
  )
  $: messageIcon = getIconPath(
    data.type === 'rules' &&
      data.item.isAssertMessageNode &&
      data.item.result === RuleResults.Success
      ? '/success-message.svg'
      : '/error-message.svg',
  )

  let isExpanded = false
  let isFocused = false
</script>

<div
  class="tree-item"
  class:focused={isFocused}
  class:selected={isFocused}
  role="treeitem"
  aria-setsize={setSize}
  aria-posinset={posinset}
  aria-selected="false"
  aria-label={data.item.name}
  aria-level={level}
  aria-expanded={isExpanded}
  draggable="false"
  tabindex="0"
  title={data.item.name}
  style="--indent: calc({level} * 8px)"
  on:click={() => (isExpanded = !isExpanded)}
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
      {#if data.type === 'rules'}
        <div
          class="icon"
          style="background-image: url({data.item.isAssertMessageNode
            ? messageIcon
            : statusIcon});"
        />
      {/if}
      {#if data.type === 'callstack'}
        <div class="icon codicon codicon-debug-stackframe" />
      {/if}
      <div class="label">
        <div class="label-container">
          <span class="name-container">
            <a class="label-name">
              <span class="highlighted-label">
                <span>{data.item.name}</span>
              </span>
            </a>
          </span>
          {#if data.type === 'rules' && data.item.duration}
            <span class="description-container">
              <span class="label-description">{data.item.duration}</span>
            </span>
          {/if}
        </div>
        {#if data.type === 'callstack' && data.item.status}
          <div class="result-container">
            <div class="result">{data.item.status}</div>
          </div>
        {/if}
        <div class="actions">
          <Toolbar {actions} />
        </div>
      </div>
    </div>
  </div>
</div>

{#if isExpanded && hasChildren}
  {#each data.item.childrenList as child, i}
    <svelte:self
      data={{
        type: data.type,
        item: child,
      }}
      level={level + 1}
      setSize={data.item.childrenList.length}
      posinset={i}
    />
  {/each}
{/if}

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

  .label {
    display: flex;
    text-overflow: ellipsis;
    overflow: hidden;
    flex: 1;
  }

  .result-container {
    display: inline-flex;
    align-items: center;
    flex: 1;
    margin-right: 6px;
    margin-left: 6px;

    .result {
      font-size: 9px;
      line-height: 10px;
      padding: 2px 4px;
      color: #fff;
      background-color: #40a040;
      border-radius: 2px;
    }
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
