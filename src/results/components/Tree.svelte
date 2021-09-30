<script lang="ts">
  import TreeItem from './TreeItem.svelte'
  import type { RuleTree, CallTraceFunction } from '../types'

  export let data:
    | {
        type: 'rules'
        tree: RuleTree
      }
    | {
        type: 'callstack'
        tree: CallTraceFunction[]
      }
</script>

<div class="tree">
  {#if data.type === 'rules'}
    {#each data.tree as item, i}
      <TreeItem
        data={{
          type: 'rules',
          item,
        }}
        setSize={data.tree.length}
        posinset={i + 1}
      />
    {/each}
  {/if}
  {#if data.type === 'callstack'}
    {#each data.tree as item, i}
      <TreeItem
        data={{
          type: 'callstack',
          item,
        }}
        setSize={data.tree.length}
        posinset={i + 1}
      />
    {/each}
  {/if}
</div>

<style>
  .tree {
    position: relative;
    transform: translate3d(0px, 0px, 0px);
    overflow: hidden;
    left: 0;
    top: 0;
    user-select: none;
  }
</style>
