<script lang="ts">
  import { writable } from 'svelte/store'
  import type { Action } from '../types'

  export const hide = writable(true)
  export let actions: Action[] = []

  function openMenu(e) {
    $hide = false
  }

  function closeMenu() {
    $hide = true
  }
</script>

<div
  class={'dropdown-content ' + ($hide ? 'hide' : '')}
  on:focusout={closeMenu}
>
  {#each actions as action}
    <button on:click={action.onClick}>action.title</button>
  {/each}
</div>

<style>
  .dropdown-content {
    position: absolute;
    background-color: #f1f1f1;
    min-width: 90px;
    overflow: auto;
    box-shadow: 0px 8px 16px 0px rgba(0, 0, 0, 0.2);
    z-index: 1;
    left: 10px;
    border-radius: 10px;
  }

  .hide {
    display: none;
  }

  .dropdown-content button {
    min-width: 90px;
    min-height: 20px;
    color: black;
    padding: 12px 16px;
    text-decoration: none;
    display: block;
  }
</style>
