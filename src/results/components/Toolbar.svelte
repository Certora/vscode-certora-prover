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
    white-space: nowrap;
    height: 100%;
  }

  .actions-container {
    display: flex;
    margin: 0 auto;
    padding: 0;
    height: 100%;
    width: 100%;
    align-items: center;
  }
</style>
