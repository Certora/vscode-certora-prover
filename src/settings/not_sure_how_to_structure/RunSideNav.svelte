<script>
  import Select from 'svelte-select'
  import ClearIcon from './slots_and_utility/ClearIcon.svelte'
  import Icon from './slots_and_utility/Icon.svelte'
  import { navState, resetNav, selectNavMenu } from './stores/store.js'

  let items = [
    {
      value: 'chocolate',
      label: 'Chocolate',
      group: 'Sweet',
      monkey: 'monkey',
    },
    { value: 'pizza', label: 'Pizza', group: 'Savory' },
    { value: 'cake', label: 'Cake', group: 'Sweet' },
    { value: 'cookies', label: 'Cookies', group: 'Savory' },
    { value: 'ice-cream', label: 'Ice Cream', group: 'Sweet' },
  ]

  let favouriteFood = undefined

  function handleSelect(event) {
    favouriteFood = event.detail
    console.log(event)
  }

  function handleClear() {
    favouriteFood = undefined
  }

  function handleNav(nav) {
    selectNavMenu(nav)
  }
</script>

<h1>My run name settings</h1>
<div class="input_wrapper" style="margin-top: 8px;">
  <div class="dark_input input_single">
    <Select
      {items}
      {Icon}
      {ClearIcon}
      on:select={handleSelect}
      on:clear={handleClear}
      placeholder="Search Settings"
    />
  </div>
</div>

<div class="nav_settings">
  <div
    class="nav_settings_child "
    on:click={() => selectNavMenu('solCheck')}
    class:checked={$navState.solCheck.checked}
    class:active={$navState.solCheck.active}
  >
    <i class="codicon codicon-file" />
    <h3>Solidity contracts</h3>
    <i class="codicon codicon-check" />
  </div>
  <div
    class="nav_settings_child"
    on:click={() => selectNavMenu('specCheck')}
    class:checked={$navState.specCheck.checked}
    class:active={$navState.specCheck.active}
  >
    <i class="codicon codicon-file" />
    <h3>Solidity contracts</h3>
    <i class="codicon codicon-check" />
  </div>
  <div
    class="nav_settings_child"
    class:checked={$navState.msgCheck.checked}
    class:active={$navState.msgCheck.active}
  >
    <i class="codicon codicon-file" />
    <h3>Solidity contracts</h3>
    <i class="codicon codicon-check" />
  </div>
</div>

<style>
  /* stylelint-disable */

  h3 {
    margin: 0;
  }
  .nav_settings {
    display: flex;
    flex-direction: column;
    gap: 8px;
  }
  .codicon-check {
    color: transparent;
    transition: color 0.2s ease-in-out;
  }
  .checked .codicon-check {
    color: var(--vscode-testing-iconPassed);
  }
  .nav_settings_child i:nth-child(3),
  .nav_settings_child i:nth-child(1) {
    height: min-content;
  }
  .nav_settings_child {
    border-radius: 4px;
    display: flex;
    padding: 8px;
    background: transparent;
    transition: background 0.2c ease-in-out;
  }
  .active.nav_settings_child {
    background: var(--vscode-list-activeSelectionBackground);
  }
  .nav_settings_child i:nth-child(3) {
    margin: auto 0 auto auto;
  }
  .nav_settings_child i:nth-child(1) {
    margin: auto 6px auto 0;
  }
</style>
