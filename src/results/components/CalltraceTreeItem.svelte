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
    SUCCESS: '#40A040',
    REVERT: '#D58511',
    SUMMARIZED: '#0050EF',
    HAVOC: '#C04040',
    THROW: '#C04040',
    DISPATCHER: '#A30057',
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
        style="background-color: {STATUSES_DICT[callTraceFunction.status]}"
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
</style>