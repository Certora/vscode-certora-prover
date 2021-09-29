<script lang="ts">
  import ToolbarItem from './ToolbarItem.svelte'

  export let actions: { title: string; icon: string; onClick: () => void }[] =
    []
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
