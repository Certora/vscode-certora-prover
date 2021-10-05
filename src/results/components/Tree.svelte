<script lang="ts">
  import TreeItem from './TreeItem.svelte'
  import type { RuleTree, CallTraceFunction } from '../types'
  import { TreeType } from '../types'

  export let data:
    | {
        type: TreeType.Rules
        tree: RuleTree
      }
    | {
        type: TreeType.Calltrace
        tree: CallTraceFunction[]
      }
</script>

<div class="tree">
  {#if data.type === TreeType.Rules}
    {#each data.tree as item, i}
      <TreeItem
        data={{
          type: TreeType.Rules,
          item,
        }}
        setSize={data.tree.length}
        posInset={i + 1}
      />
    {/each}
  {/if}
  {#if data.type === TreeType.Calltrace}
    {#each data.tree as item, i}
      <TreeItem
        data={{
          type: TreeType.Calltrace,
          item,
        }}
        setSize={data.tree.length}
        posInset={i + 1}
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
