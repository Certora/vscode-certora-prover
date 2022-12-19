<script lang="ts">
  /* ---------------------------------------------------------------------------------------------
   *  Component that shows one rule results
   *-------------------------------------------------------------------------------------------- */

  import { createEventDispatcher } from 'svelte'
  import BaseTreeItem from './BaseTreeItem.svelte'
  import TreeIcon from './TreeIcon.svelte'
  import { navigateToCode } from '../extension-actions'
  import type { Action, Rule, Assert } from '../types'

  export let rule: Rule = null
  export let assert: Assert = null
  export let setSize = 1
  export let posInset = 1
  export let actions: Action[] = []
  export let level = 1
  export let duplicateFunc

  const dispatch = createEventDispatcher<{ fetchOutput: Assert | Rule }>()

  $: label = rule?.name || assert?.message
  $: formattedLabel = label === null || label === 'null' ? 'No message' : label
  $: ruleIcon = rule?.status
    ? `${rule.status}-rule-status.svg`
    : `unknown-rule-status.svg`
  $: assertIcon = assert?.status
    ? `${assert.status}-assert-message.svg`
    : `unknown-assert-message.svg`

  let isExpanded = false

  function duplicateRule() {
    console.log('duplicate rule was clicked')
    duplicateFunc(rule.name)
  }
</script>

<BaseTreeItem
  {label}
  {setSize}
  {posInset}
  {level}
  {actions}
  hasChildren={rule?.children.length > 0 || rule?.asserts.length > 0}
  bind:isExpanded
  on:click={() => {
    if (assert) {
      dispatch('fetchOutput', assert)
      return
    }

    if (!isExpanded && rule) {
      dispatch('fetchOutput', rule)
    }

    isExpanded = !isExpanded
  }}
>
  <TreeIcon path={rule ? ruleIcon : assertIcon} duplicateFunc={duplicateRule} />
  <div class="label">
    <div class="label-container">
      <span class="name-container">
        <a class="label-name">
          <span class="highlighted-label">
            <span>{formattedLabel}</span>
          </span>
        </a>
      </span>
      {#if assert}
        <span class="description-container">
          <span class="label-description">{assert.duration}sec</span>
        </span>
      {/if}
    </div>
  </div>
</BaseTreeItem>

{#if isExpanded && rule?.children.length > 0}
  {#each rule.children as child, i}
    <svelte:self
      rule={child}
      level={level + 1}
      setSize={rule.children.length}
      posInset={i}
      actions={child.jumpToDefinition.length > 0
        ? [
            {
              title: 'Go to code',
              icon: 'go-to-file',
              onClick: () => {
                navigateToCode(child.jumpToDefinition)
              },
            },
          ]
        : []}
      on:fetchOutput
    />
  {/each}
{/if}
{#if isExpanded && rule?.asserts.length > 0}
  {#each rule.asserts as child, i}
    <svelte:self
      assert={child}
      level={level + 1}
      setSize={rule.children.length}
      posInset={i}
      actions={child.jumpToDefinition.length > 0
        ? [
            {
              title: 'Go to code',
              icon: 'go-to-file',
              onClick: () => {
                navigateToCode(child.jumpToDefinition)
              },
            },
          ]
        : []}
      on:fetchOutput
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
