<script>
  /* ---------------------------------------------------------------------------------------------
   *  Wrapper for the settings view component. This also auto saved the changes to the fields.
   *  The different components are side navigation, solidity settings tab, spec settings tab, validation message.
   *-------------------------------------------------------------------------------------------- */

  import RunSideNav from './RunSideNav.svelte'
  import SpecSettingsTab from './SpecSettingsTab.svelte'
  import SolSettingsTab from './SolSettingsTab.svelte'
  import VerificationMessageTab from './VerificationMessageTab.svelte'
  import {
    checkMyInputs,
    solidityObj,
    specObj,
    verification_message,
    solAdditionalContracts,
  } from './stores/store.js'
  import { log, Sources } from './utils/log'

  $: $solidityObj ||
    $specObj ||
    $verification_message ||
    $solAdditionalContracts ||
    $checkMyInputs,
    save()

  function save() {
    let inputs = document.querySelectorAll('.simple_txt_input')
    inputs = Array.from(inputs)
    $checkMyInputs = inputs.some(el => {
      return el.classList.contains('field-danger')
    })
    let form = {
      solidityObj: $solidityObj,
      specObj: $specObj,
      verificationMessage: $verification_message,
      solidityAdditionalContracts: $solAdditionalContracts,
      checkMyInputs: $checkMyInputs,
    }
    log({
      action: 'Send "create-conf-file" command',
      source: Sources.SettingsWebview,
      info: form,
    })
    vscode.postMessage({
      command: 'create-conf-file',
      payload: form,
    })
  }
</script>

<div class="main_wrapper">
  <div class="left_wrapper media"><RunSideNav /></div>
  <div class="right_wrapper">
    <div class="top_nav"><RunSideNav /></div>
    <SolSettingsTab />
    <SpecSettingsTab />
    <VerificationMessageTab />
    <div class="feedback_space" />
    <div class="feedback">
      <a
        id="feedback-button"
        class="feedback-button"
        title="Feedback"
        href="https://forms.gle/zTadNeJZ7g1vmqFg6"
        >Feedback
        <div class="action-label codicon codicon-action codicon-feedback" />
      </a>
    </div>
  </div>
</div>

<style>
  /* stylelint-disable */
  .top_nav {
    display: none;
  }
  .main_wrapper {
    display: flex;
    box-sizing: border-box;
    height: 100vh;
    overflow: hidden;
  }
  .feedback {
    position: fixed;
    width: 100%;
    height: 60px;
    bottom: 0px;
    right: 0px;
    background-color: var(--background);
  }
  .feedback_space {
    position: relative;
    width: 100%;
    height: 70px;
    bottom: 0px;
    right: 0px;
    background-color: var(--background);
  }
  .feedback-button {
    position: fixed;
    width: 100px;
    height: 22px;
    bottom: 15px;
    right: 15px;
    background-color: var(--vscode-button-foreground);
    color: var(--vscode-button-background);
    border-radius: 30px;
    padding-left: 13px;
    padding-top: 6px;
    border-color: transparent;
    text-decoration: none;
    cursor: pointer;
  }
  .action-label {
    position: relative;
    display: inline-block;
    overflow: hidden;
    float: right;
    padding-right: 15px;
  }
  .left_wrapper {
    box-sizing: border-box;
    width: 30%;
    border-right: 1px solid var(--vscode-sideBarSectionHeader-border);
    padding: 16px;
  }
  .right_wrapper {
    box-sizing: border-box;
    width: 70%;
    padding: 16px;
    overflow-y: scroll;
    overflow-x: hidden;
  }
  .right_wrapper::-webkit-scrollbar {
    display: none;
  }
  @media (max-width: 820px) {
    .media {
      display: none;
    }
    .right_wrapper {
      width: 100%;
      padding: 0;
    }
    .top_nav {
      display: block;
    }

    :global(body) {
      padding: 16px;
      overflow-x: hidden;
    }
  }
</style>
