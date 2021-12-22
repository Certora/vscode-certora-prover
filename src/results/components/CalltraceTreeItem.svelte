<script lang="ts">
  import { createEventDispatcher } from 'svelte'
  import BaseTreeItem from './BaseTreeItem.svelte'
  import TreeIcon from './TreeIcon.svelte'
  import type { Action, CallTraceFunction } from '../types'

  export let callTraceFunction: CallTraceFunction
  export let setSize = 1
  export let posInset = 1
  export let actions: Action[] = []
  export let level = 1

  const dispatch =
    createEventDispatcher<{ selectCalltraceFunction: CallTraceFunction }>()

  const STATUSES_DICT = {
    SUCCESS: '#40a040',
    REVERT: '#d58511',
    SUMMARIZED: '#0050ef',
    HAVOC: '#c04040',
    THROW: '#c04040',
    DISPATCHER: '#a30057',
    'REVERT CAUSE': '#732626',
    DUMP: '#732626',
  }

  $: hasChildren = callTraceFunction.childrenList.length > 0

  let isExpanded = false
</script>

<BaseTreeItem
  label={callTraceFunction.name}
  {hasChildren}
  {setSize}
  {posInset}
  {level}
  {actions}
  bind:isExpanded
  on:click={() => {
    isExpanded = !isExpanded
    dispatch('selectCalltraceFunction', callTraceFunction)
  }}
>
  <TreeIcon codicon="codicon-debug-stackframe" />
  <div class="label">
    <div class="label-container">
      <span class="name-container">
        <a class="label-name">
          <span class="highlighted-label">
            <span>{callTraceFunction.name}</span>
          </span>
        </a>
      </span>
    </div>
    <div class="result-container">
      <div
        class="result"
        style="background-color: {STATUSES_DICT[callTraceFunction.status]};"
      >
        {callTraceFunction.status}
      </div>
    </div>
  </div>
</BaseTreeItem>

{#if isExpanded && hasChildren}
  {#each callTraceFunction.childrenList as child, i}
    <svelte:self
      callTraceFunction={child}
      level={level + 1}
      setSize={callTraceFunction.childrenList.length}
      posInset={i}
      {actions}
      on:selectCalltraceFunction
    />
  {/each}
{/if}

<style lang="postcss">
  .label {
    display: flex;
    overflow: hidden;
    flex: 1;
    text-overflow: ellipsis;
  }

  .result-container {
    display: inline-flex;
    flex: 1;
    align-items: center;
    margin-right: 6px;
    margin-left: 6px;

    .result {
      padding: 2px 4px;
      border-radius: 2px;
      color: #fff;
      font-size: 9px;
      line-height: 10px;
    }
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
</style>
