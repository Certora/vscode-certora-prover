<script lang="ts">
  // import { writable } from 'svelte/store'
  import type { Action } from '../types'

  export let hide = false
  export let actions: Action[] = []
  export let pos = { x: 0, y: 0 }
</script>

<div
  class={'dropdown-content ' + (hide ? '' : 'hide')}
  style="top: {pos.y}px; left: {pos.x}px;"
>
  <div class="gap" />
  {#each actions as action}
    <button on:click={action.onClick}>{action.title}</button>
  {/each}
  <div class="gap" />
</div>

<style>
  .dropdown-content {
    position: absolute;
    background-color: #f1f1f1;
    width: 90px;
    /* height: 90px; */
    display: table;
    overflow: visible;
    box-shadow: 0px 8px 16px 0px rgba(0, 0, 0, 0.2);
    z-index: 1;
    left: 10px;
    border-radius: 5px;
    background-color: var(--vscode-menu-foreground);
  }

  .hide {
    display: none;
  }

  .gap {
    margin-top: 5px;
  }

  .dropdown-content button {
    height: 22%;
    width: 90%;
    font-size: 11px;
    text-align: left;
    color: black;
    /* margin-top: 5px; */
    margin-left: 5px;
    text-decoration: none;
    display: table-row;
    border: none;
    border-radius: 5px;
    background-color: var(--vscode-menu-foreground);

    &:hover {
      background-color: var(--vscode-progressBar-background);
      color: white;
    }
  }
</style>
