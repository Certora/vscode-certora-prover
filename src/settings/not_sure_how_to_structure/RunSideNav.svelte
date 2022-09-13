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
    <i>
      <svg
        xmlns="http://www.w3.org/2000/svg"
        width="16"
        height="16"
        viewBox="0 0 16 16"
        fill="inherit"
      >
        <path
          d="M6.208 8.4L8 9.456H8.048C9.25333 8.72 10.1707 8.18667 10.8 7.856V7.808C10.576 7.40267 10.3093 6.96533 10 6.496L8.048 3.248L7.648 3.904C7.37067 4.36267 7.17333 4.70933 7.056 4.944C6.97067 5.09333 6.832 5.32267 6.64 5.632C6.45867 5.93067 6.33067 6.15467 6.256 6.304C5.85067 6.96533 5.54667 7.44533 5.344 7.744V7.808C5.44 7.91467 5.632 8.05333 5.92 8.224L6.208 8.4ZM8.352 10.304C8.32 10.3147 8.26133 10.3467 8.176 10.4L8 10.496C7.872 10.4107 7.67467 10.2933 7.408 10.144C7.14133 9.99467 6.93333 9.88267 6.784 9.808C6.64533 9.72267 6.42667 9.58933 6.128 9.408C5.82933 9.216 5.60533 9.07733 5.456 8.992C5.43467 8.98133 5.39733 8.96533 5.344 8.944L5.248 8.896L5.648 9.456C6.11733 10.1173 6.48533 10.6133 6.752 10.944C6.88 11.1467 7.08267 11.44 7.36 11.824C7.648 12.208 7.86133 12.5013 8 12.704V12.72C8.01067 12.7413 8.02667 12.752 8.048 12.752L9.904 10.144C10 10.016 10.1493 9.81333 10.352 9.536C10.5547 9.248 10.704 9.03467 10.8 8.896C9.88267 9.38667 9.06667 9.856 8.352 10.304Z"
          fill="inherit"
        />
      </svg>
    </i>

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
    <i class="codicon codicon-symbol-method" />
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
    <i class="codicon codicon-comment " />
    <h3>Verification message</h3>
    <i class="codicon codicon-check" />
  </button>
</div>

<style>
  /* stylelint-disable */
  H1 {
    font-size: 20px;
    font-weight: 600;
  }
  h3 {
    margin: 0;
    font-size: 13px;
    margin-right: 6px;
    align-self: center;
  }
  i {
    display: flex;
    font-size: 13px;
  }
  .nav_settings {
    display: flex;
    flex-direction: column;
    gap: 8px;
  }
  .codicon-check {
    color: transparent;
    /* transition: color 0.2s ease-in-out; */
    margin: auto 0 auto auto;
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
    background: var(--vscode-button-background);
    /* background: var(--vscode-list-activeSelectionBackground); */
    color: var(--vscode-button-foreground);
    fill: var(--vscode-button-foreground);
  }
  .nav_settings_child i:nth-child(3) {
    margin: auto 0 auto auto;
  }
  .nav_settings_child i:nth-child(1) {
    margin: auto 6px auto 0;
  }
  button {
    color: var(--vscode-primary-foreground);
    fill: var(--vscode-primary-foreground);
  }
  button:disabled {
    filter: brightness(60%);
    /* color:var(--vscode-disabledForeground); */
  }
  button:not(:disabled):not(.active):hover {
    background: var(--vscode-dropdown-background);
  }
  @media (max-width: 820px) {
    .nav_settings {
      flex-direction: row;
      margin-bottom: 16px;
    }
    h3 {
      font-size: 11px;
      font-weight: normal;
    }
  }
</style>
