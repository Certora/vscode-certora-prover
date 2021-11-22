<script lang="ts">
  import RulesTreeItem from './RulesTreeItem.svelte'
  import CalltraceTreeItem from './CalltraceTreeItem.svelte'
  import { navigateToCode } from '../utils/navigateToCode'
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
        actions={[
          {
            title: 'Go to code',
            icon: 'go-to-file',
            onClick: () => {
              navigateToCode(rule.jumpToDefinition)
            },
          },
        ]}
        on:selectAssert
      />
    {/each}
  {/if}
  {#if data.type === TreeType.Calltrace}
    {#each data.tree as callTraceFunction, i}
      <CalltraceTreeItem
        {callTraceFunction}
        setSize={data.tree.length}
        posInset={i + 1}
        actions={[
          {
            title: 'Go to code',
            icon: 'go-to-file',
            onClick: () => {
              navigateToCode(callTraceFunction.jumpToDefinition)
            },
          },
        ]}
        on:selectCalltraceFunction
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
