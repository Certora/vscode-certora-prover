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
    isReset,
    disableForm,
  } from './stores/store.js'
  import { log, Sources } from './utils/log'

  $: $solidityObj ||
    $specObj ||
    $verification_message ||
    $solAdditionalContracts ||
    $checkMyInputs,
    save()

  function save() {
    setTimeout(() => {
      let inputs = document.querySelectorAll('.simple_txt_input')
      inputs = Array.from(inputs)
      $checkMyInputs = inputs.some(el => {
        return el.classList.contains('field-danger')
      })
    })

    let form = {
      solidityObj: $solidityObj,
      specObj: $specObj,
      verificationMessage: $verification_message,
      solidityAdditionalContracts: $solAdditionalContracts,
      checkMyInputs: $checkMyInputs,
    }
    // do not create run on fields initialization
    if (!$isReset) {
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
  }
</script>

<div class="main_wrapper ">
  <div class="left_wrapper media"><RunSideNav /></div>
  <div class="right_wrapper">
    <div class="top_nav"><RunSideNav /></div>
    <SolSettingsTab />
    <SpecSettingsTab />
    <VerificationMessageTab />
  </div>
</div>

<style>
  .top_nav {
    display: none;
  }
  .main_wrapper {
    display: flex;
    box-sizing: border-box;
    height: 100vh;
    overflow: hidden;
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
