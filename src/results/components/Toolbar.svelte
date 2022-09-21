<script lang="ts">
  import ToolbarItem from './ToolbarItem.svelte'
  import type { Action } from '../types'

  export let actions: Action[] = []
</script>

<div class="toolbar">
  <div class="action-bar">
    <ul class="actions-container">
      {#each actions as action}
        <ToolbarItem
          title={action.title}
          icon={action.icon}
          link={action.link}
          on:click={action.onClick}
        />
      {/each}
    </ul>
  </div>
</div>

<style>
  .toolbar {
    height: 100%;
  }

  .action-bar {
    height: 100%;
    white-space: nowrap;
  }

  .actions-container {
    display: flex;
    width: 100%;
    height: 100%;
    align-items: center;
    padding: 0;
    margin: 0 auto;
  }
</style>
