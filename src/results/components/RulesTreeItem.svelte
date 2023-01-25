<script lang="ts">
  /* ---------------------------------------------------------------------------------------------
   *  Component that shows one rule results
   *-------------------------------------------------------------------------------------------- */

  import { createEventDispatcher } from 'svelte'
  import BaseTreeItem from './BaseTreeItem.svelte'
  import TreeIcon from './TreeIcon.svelte'
  import { navigateToCode } from '../extension-actions'
  import { Action, Rule, Assert, RuleStatuses } from '../types'
  import { writable } from 'svelte/store'
  import { expandables } from '../store/store'

  export let rule: Rule = null
  export let assert: Assert = null
  export let setSize = 1
  export let posInset = 1
  export let actions: Action[] = []
  export let level = 1
  export let duplicateFunc = null
  export let initialExpandedState: boolean = false
  export let runDisplayName

  const dispatch = createEventDispatcher<{ fetchOutput: Assert | Rule }>()
  $: allowDuplicate =
    rule &&
    typeof duplicateFunc === 'function' &&
    rule.jumpToDefinition.length > 0
  $: label = rule?.name || assert?.message
  $: formattedLabel = label === null || label === 'null' ? 'No message' : label
  $: ruleIcon = rule?.status
    ? `${rule.status}-rule-status.svg`
    : `unknown-rule-status.svg`
  $: assertIcon = assert?.status
    ? `${assert.status}-assert-message.svg`
    : `unknown-assert-message.svg`

  let isExpanded = writable(initialExpandedState)

  function duplicateRule() {
    if (allowDuplicate) {
      duplicateFunc(rule.name)
    }
  }

  function getHoverPath(rule) {
    if (!allowDuplicate) {
      return ''
    } else if (rule && rule.status && rule.status === RuleStatuses.Verified) {
      return 'rerun-success.svg'
    }
    return 'unable-to-run.svg'
  }
</script>

<BaseTreeItem
  label={rule?.status ? rule.status : formattedLabel}
  {setSize}
  {posInset}
  {level}
  {actions}
  hasChildren={rule?.children.length > 0 || rule?.asserts.length > 0}
  bind:isExpanded={$isExpanded}
  on:click={() => {
    if (assert) {
      dispatch('fetchOutput', assert)
      return
    }

    if (!$isExpanded && rule) {
      dispatch('fetchOutput', rule)
    }

    $isExpanded = !$isExpanded
    $expandables = $expandables.map(element => {
      if (element.title === runDisplayName && element.tree.length > 0) {
        element.tree = element.tree.map(treeItem => {
          if (treeItem.title === rule.name) {
            treeItem.isExpanded = $isExpanded
          }
          return treeItem
        })
      }
      return element
    })
  }}
>
  <TreeIcon
    path={rule ? ruleIcon : assertIcon}
    duplicateFunc={duplicateRule}
    hover={getHoverPath(rule)}
  />
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

{#if $isExpanded && rule?.children.length > 0}
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
{#if $isExpanded && rule?.asserts.length > 0}
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
