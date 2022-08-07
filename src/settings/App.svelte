<script lang="ts">
  import { onMount, onDestroy } from 'svelte'
  import { nanoid } from 'nanoid'
  import VerifyAdditionalContract from './components/VerifyAdditionalContract.svelte'
  import Link from './components/Link.svelte'
  import ExtendedSettings from './components/ExtendedSettings.svelte'
  import BaseSetting from './components/BaseSetting.svelte'
  import AdditionalSettings from './components/AdditionalSettings.svelte'
  import OneFieldSetting from './components/OneFieldSetting.svelte'
  import SettingWithFilePicker from './components/SettingWithFilePicker.svelte'
  // new cutting edge stuff
  import { log, Sources } from './utils/log'
  import { confFileToFormData } from './utils/confFileToFormData'
  import type { Form } from './types'
  import { EventTypesFromExtension, EventsFromExtension } from './types'
  import RenamedMainWrapper from './not_sure_how_to_structure/RenamedMainWrapper.svelte'

  let solidityFiles: string[] = []
  let specFiles: string[] = []
  let submitButtonText = 'Create conf file'
  let test = false
  let form: Form = {
    name: '',
    mainSolidityFile: '',
    mainContractName: '',
    specFile: '',
    solidityCompiler: '',
    useAdditionalContracts: false,
    additionalContracts: solidityFiles.map(file => ({ file, name: '' })),
    link: [
      {
        id: nanoid(),
        contractName: '',
        fieldName: '',
        associatedContractName: '',
      },
    ],
    extendedSettings: [{ id: nanoid(), flag: '' }],
    useStaging: false,
    branch: 'master',
    cacheName: '',
    message: '',
    additionalSettings: [
      {
        id: nanoid(),
        option: '',
        value: '',
      },
    ],
  }

  const listener = (e: MessageEvent<EventsFromExtension>) => {
    switch (e.data.type) {
      case EventTypesFromExtension.SmartContractsFilesUpdated:
        log({
          action: 'Received "smart-contracts-files-updated" command',
          source: Sources.SettingsWebview,
          info: e.data.payload,
        })
        solidityFiles = e.data.payload.sol
        specFiles = e.data.payload.spec
        break
      case EventTypesFromExtension.EditConfFile:
        log({
          action: 'Received "edit-conf-file" command',
          source: Sources.SettingsWebview,
          info: e.data.payload,
        })
        console.log(e.data.payload, e.data.payload[1])
        form = confFileToFormData(e.data.payload[0], e.data.payload[1])
        submitButtonText = 'Save'
        break
      default:
        break
    }
  }

  function createConfFile() {
    if (form.mainSolidityFile && form.mainContractName && form.specFile) {
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

  onMount(() => {
    window.addEventListener('message', listener)
  })

  onDestroy(() => {
    window.removeEventListener('message', listener)
  })
</script>

{#if test}
  <div class="settings">
    <h2 class="section-title">General</h2>
    <SettingWithFilePicker
      title="Main Solidity File"
      description="Pick solidity file"
      refreshButtonTitle="Update list of contracts"
      files={solidityFiles}
      mandatory={true}
      bind:file={form.mainSolidityFile}
    />
    <OneFieldSetting
      title="Main Contract Name"
      description="Contract name"
      mandatory={true}
      bind:value={form.mainContractName}
    />
    <SettingWithFilePicker
      title="Spec File"
      description="Spec file path"
      refreshButtonTitle="Update list of spec files"
      files={specFiles}
      mandatory={true}
      bind:file={form.specFile}
    />
    <OneFieldSetting
      title="Solidity Compiler"
      description="Solidity compiler executable file (expected to be added to the $PATH environment variable). By default, solc (or solc.exe on Windows) is used"
      bind:value={form.solidityCompiler}
    />
    <VerifyAdditionalContract
      {solidityFiles}
      bind:useAdditionalContracts={form.useAdditionalContracts}
      bind:additionalContracts={form.additionalContracts}
    />
    <Link
      useAdditionalContracts={form.useAdditionalContracts}
      bind:link={form.link}
    />

    <h2 class="section-title">Advanced</h2>
    <ExtendedSettings bind:flags={form.extendedSettings} />
    <BaseSetting title="Staging">
      <div class="staging">
        <vscode-checkbox
          checked={form.useStaging}
          on:change={e => (form.useStaging = e.target.checked)}
        />
      </div>
    </BaseSetting>
    <OneFieldSetting
      title="Cache Name"
      description="Optimize the pre-analysis by using cache"
      bind:value={form.cacheName}
    />
    <OneFieldSetting
      title="Message"
      description="Adds a message description to your run, similar to a commit message. This message will appear in the title of the completion email sent to you"
      bind:value={form.message}
    />
    <AdditionalSettings bind:settings={form.additionalSettings} />
    <div class="save-button">
      <button
        class="vscode-button"
        disabled={!(
          form.mainSolidityFile &&
          form.mainContractName &&
          form.specFile
        )}
        on:click={createConfFile}>{submitButtonText}</button
      >
    </div>
  </div>
{:else}
  <RenamedMainWrapper />
{/if}

<style lang="postcss">
  /* stylelint-disable */

  @import './styles.css';

  :global(vscode-dropdown) {
    color: var(--dropdown-text-color);
  }

  :global(body) {
    padding: 44px 24px;
  }
  /* :global(body) {
    padding: 26px 24px;
  } */

  :global(:root) {
    --space-xs: 4px;
    --space-sm: 9px;
    --space-md: 14px;
    --space-lg: 18px;
    --space-xl: 26px;
    --space-xxl: 30px;
  }

  /* :global(body.vscode-light) {
    --dropdown-text-color: #000;
  } */

  :global(body.vscode-dark) {
    --dropdown-text-color: var(--dropdown-foreground);
  }

  .settings {
    display: flex;
    flex-direction: column;
    gap: var(--space-xl);
  }

  .section-title {
    margin-top: 0;
    margin-bottom: calc(
      var(--space-lg) - var(--space-xl)
    ); /* because we have `gap: var(--space-xl);` in .settings */

    font-size: 26px;
    font-weight: 600;
    line-height: 31px;
  }

  .staging {
    display: flex;
    flex-direction: column;
    align-items: flex-start;
    gap: var(--space-sm);
  }

  .save-button {
    position: fixed;
    bottom: 0;
    width: 100%;
    padding: 30px 24px;
    border-top: 1px solid var(--panel-view-border);
    background-color: var(--panel-view-background);
  }

  .vscode-button {
    padding: 6px 11px;
    border: none;
    background-color: var(--vscode-button-background);
    color: var(--button-primary-foreground);
    font-family: var(--font-family);
    font-size: var(--type-ramp-base-font-size);
  }

  .vscode-button:disabled {
    background-color: var(--vscode-button-background);
    color: var(--button-primary-foreground);
    cursor: default;
    opacity: 0.5;
  }

  button:hover {
    background-color: var(--vscode-button-hoverBackground);
    cursor: pointer;
  }
</style>
