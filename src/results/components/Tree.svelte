<script lang="ts">
  /* ---------------------------------------------------------------------------------------------
   *  Component that shows results of a run, in a tree view
   *-------------------------------------------------------------------------------------------- */

  import RulesTreeItem from './RulesTreeItem.svelte'
  import CalltraceTreeItem from './CalltraceTreeItem.svelte'
  import { navigateToCode } from '../extension-actions'
  import type { Rule, CallTraceFunction } from '../types'
  import { TreeType } from '../types'

  export let data:
    | {
        type: TreeType.Rules
        tree: Rule[]
      }
    | {
        type: TreeType.Calltrace
        tree: CallTraceFunction[]
      }
</script>

<div class="tree">
  {#if data.type === TreeType.Rules}
    {#each data.tree as rule, i}
      <RulesTreeItem
        {rule}
        setSize={data.tree.length}
        posInset={i + 1}
        actions={rule.jumpToDefinition.length > 0
          ? [
              {
                title: 'Go to code',
                icon: 'go-to-file',
                onClick: () => {
                  navigateToCode(rule.jumpToDefinition)
                },
              },
            ]
          : []}
        on:fetchOutput
      />
    {/each}
  {/if}
  {#if data.type === TreeType.Calltrace}
    {#each data.tree as callTraceFunction, i}
      <CalltraceTreeItem
        {callTraceFunction}
        setSize={data.tree.length}
        posInset={i + 1}
        actions={callTraceFunction.jumpToDefinition.length > 0
          ? [
              {
                title: 'Go to code',
                icon: 'go-to-file',
                onClick: () => {
                  navigateToCode(callTraceFunction.jumpToDefinition)
                },
              },
            ]
          : []}
        on:selectCalltraceFunction
      />
    {/each}
  {/if}
</div>

<style>
  .tree {
    position: relative;
    top: 0;
    left: 0;
    overflow: hidden;
    transform: translate3d(0, 0, 0);
    user-select: none;
  }
</style>
