<script lang="ts">
  import { createEventDispatcher } from 'svelte'
  import BaseTreeItem from './BaseTreeItem.svelte'
  import Toolbar from './Toolbar.svelte'
  import TreeIcon from './TreeIcon.svelte'
  import type { Action, Rule, Assert } from '../types'

  export let rule: Rule = null
  export let assert: Assert = null
  export let setSize = 1
  export let posInset = 1
  export let actions: Action[] = []
  export let level = 1

  const dispatch = createEventDispatcher<{ selectAssert: Assert }>()

  $: label = rule?.name || assert?.message
  $: ruleIcon = rule?.status
    ? `${rule.status}-rule-status.svg`
    : `unknown-rule-status.svg`
  $: assertIcon = assert?.status
    ? `${assert.status}-assert-message.svg`
    : `unknown-assert-message.svg`

  let isExpanded = false
</script>

<BaseTreeItem
  {label}
  {setSize}
  {posInset}
  {level}
  hasChildren={rule?.children.length > 0 || rule?.asserts.length > 0}
  bind:isExpanded
  on:click={() => {
    if (assert) {
      dispatch('selectAssert', assert)
    } else {
      isExpanded = !isExpanded
    }
  }}
>
  <TreeIcon path={rule ? ruleIcon : assertIcon} />
  <div class="label">
    <div class="label-container">
      <span class="name-container">
        <a class="label-name">
          <span class="highlighted-label">
            <span>{label}</span>
          </span>
        </a>
      </span>
      {#if assert}
        <span class="description-container">
          <span class="label-description">{assert.duration}sec</span>
        </span>
      {/if}
    </div>
    <div class="actions">
      <Toolbar {actions} />
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
      on:selectAssert
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
