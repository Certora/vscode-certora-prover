<script>
  import {
    navState,
    selectNavMenu,
    solidityObj,
    specObj,
    verification_message,
  } from './stores/store.js'
  $: solDisabledState =
    $solidityObj.mainFile !== '' &&
    $solidityObj.mainContract !== '' &&
    $solidityObj.compiler.ver !== ''
</script>

<h1>My run name settings</h1>
<div class="nav_settings">
  <button
    class="nav_settings_child "
    on:click={() => selectNavMenu('solCheck')}
    class:checked={solDisabledState}
    class:active={$navState.solCheck.active}
  >
    <i class="codicon codicon-file" />
    <h3>Solidity contracts</h3>
    <i class="codicon codicon-check" />
  </button>
  <button
    class="nav_settings_child"
    on:click={() => selectNavMenu('specCheck')}
    class:checked={$specObj.specFile !== ''}
    class:active={$navState.specCheck.active}
    disabled={!solDisabledState}
  >
    <i class="codicon codicon-file" />
    <h3>Certora spec</h3>
    <i class="codicon codicon-check" />
  </button>
  <button
    class="nav_settings_child"
    on:click={() => selectNavMenu('msgCheck')}
    class:checked={$verification_message !== ''}
    class:active={$navState.msgCheck.active}
    disabled={$specObj.specFile == ''}
  >
    <i class="codicon codicon-file" />
    <h3>Verification message</h3>
    <i class="codicon codicon-check" />
  </button>
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
    border: 0;
    border-radius: 4px;
    cursor: pointer;
    display: flex;
    padding: 8px;
    background: transparent;
    transition: background 0.2c ease-in-out;
  }
  .nav_settings_child:disabled {
    cursor: not-allowed;
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
