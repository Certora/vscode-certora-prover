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
        fill="none"
      >
        <path
          d="M6.208 8.4L8 9.456H8.048C9.25333 8.72 10.1707 8.18667 10.8 7.856V7.808C10.576 7.40267 10.3093 6.96533 10 6.496L8.048 3.248L7.648 3.904C7.37067 4.36267 7.17333 4.70933 7.056 4.944C6.97067 5.09333 6.832 5.32267 6.64 5.632C6.45867 5.93067 6.33067 6.15467 6.256 6.304C5.85067 6.96533 5.54667 7.44533 5.344 7.744V7.808C5.44 7.91467 5.632 8.05333 5.92 8.224L6.208 8.4ZM8.352 10.304C8.32 10.3147 8.26133 10.3467 8.176 10.4L8 10.496C7.872 10.4107 7.67467 10.2933 7.408 10.144C7.14133 9.99467 6.93333 9.88267 6.784 9.808C6.64533 9.72267 6.42667 9.58933 6.128 9.408C5.82933 9.216 5.60533 9.07733 5.456 8.992C5.43467 8.98133 5.39733 8.96533 5.344 8.944L5.248 8.896L5.648 9.456C6.11733 10.1173 6.48533 10.6133 6.752 10.944C6.88 11.1467 7.08267 11.44 7.36 11.824C7.648 12.208 7.86133 12.5013 8 12.704V12.72C8.01067 12.7413 8.02667 12.752 8.048 12.752L9.904 10.144C10 10.016 10.1493 9.81333 10.352 9.536C10.5547 9.248 10.704 9.03467 10.8 8.896C9.88267 9.38667 9.06667 9.856 8.352 10.304Z"
          fill="white"
        />
      </svg>
      <!-- <svg xmlns="http://www.w3.org/2000/svg" width="9" height="13" viewBox="0 0 6 10" fill="none">
      <path d="M1.208 5.4L3 6.456H3.048C4.25333 5.72 5.17067 5.18667 5.8 4.856V4.808C5.576 4.40267 5.30933 3.96533 5 3.496L3.048 0.247999L2.648 0.903999C2.37067 1.36267 2.17333 1.70933 2.056 1.944C1.97067 2.09333 1.832 2.32267 1.64 2.632C1.45867 2.93067 1.33067 3.15467 1.256 3.304C0.850667 3.96533 0.546667 4.44533 0.344 4.744V4.808C0.44 4.91467 0.632 5.05333 0.92 5.224L1.208 5.4ZM3.352 7.304C3.32 7.31467 3.26133 7.34667 3.176 7.4L3 7.496C2.872 7.41067 2.67467 7.29333 2.408 7.144C2.14133 6.99467 1.93333 6.88267 1.784 6.808C1.64533 6.72267 1.42667 6.58933 1.128 6.408C0.829334 6.216 0.605334 6.07733 0.456 5.992C0.434667 5.98133 0.397334 5.96533 0.344 5.944L0.248 5.896L0.648 6.456C1.11733 7.11733 1.48533 7.61333 1.752 7.944C1.88 8.14667 2.08267 8.44 2.36 8.824C2.648 9.208 2.86133 9.50133 3 9.704V9.72C3.01067 9.74133 3.02667 9.752 3.048 9.752L4.904 7.144C5 7.016 5.14933 6.81333 5.352 6.536C5.55467 6.248 5.704 6.03467 5.8 5.896C4.88267 6.38667 4.06667 6.856 3.352 7.304Z" fill="white"/>
      </svg> -->
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
    <i>
      <svg
        xmlns="http://www.w3.org/2000/svg"
        width="13"
        height="14"
        viewBox="0 0 13 14"
        fill="none"
      >
        <path
          d="M11.4933 3L6.53333 0.0133333H5.52L0.506667 3L0.0266666 3.85333V9.88L0.506667 10.7333L5.52 13.72H6.53333L11.4933 10.7333L12.0267 9.88V3.85333L11.4933 3ZM5.52 12.5467L0.986667 9.88V4.70667L5.52 7.16V12.5467ZM1.25333 3.69333L6 0.866667L10.7467 3.69333L6 6.30667L1.25333 3.69333ZM11.0133 9.88L6.53333 12.5467V7.16L11.0133 4.70667V9.88Z"
          fill="#CCCCCC"
        />
      </svg>
    </i>
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
    <i>
      <svg
        xmlns="http://www.w3.org/2000/svg"
        width="14"
        height="14"
        viewBox="0 0 14 14"
        fill="none"
      >
        <path
          d="M13.5067 0.973333H0.493333L0.0133333 1.50667V10.52L0.493333 11H3V13.5067L3.85333 13.88L6.73333 11H13.5067L13.9867 10.52V1.50667L13.5067 0.973333ZM13.0267 9.98667H6.52L6.14667 10.1467L4.01333 12.28V10.52L3.48 9.98667H1.02667V1.98667H13.0267V9.98667Z"
          fill="#CCCCCC"
        />
      </svg>
    </i>

    <h3>Verification message</h3>
    <i class="codicon codicon-check" />
  </button>
</div>

<style>
  /* stylelint-disable */

  h3 {
    margin: 0;
    font-size: 13px;
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
    margin-left: auto 0 auto auto;
  }
  .nav_settings_child i:nth-child(1) {
    margin: auto 6px auto 0;
  }
</style>
