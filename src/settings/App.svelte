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
  // testing files with store
  import {
    solFilesArr,
    specFilesArr,
    solidityObj,
  } from './not_sure_how_to_structure/stores/store.js'

  $: $solidityObj, console.log($solidityObj)

  let solidityFiles: string[] = []
  let solidityFilesNew
  let specFiles: string[] = []
  let specFilesNew

  let submitButtonText = 'Create conf file'
  let test = false
  let form: Form = {
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
    useStaging: true,
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
        solidityFilesNew = solidityFiles.map(str => {
          return { value: str, label: str }
        })
        solidityFilesNew.unshift({ value: 'Browse...', label: 'Browse...' })
        specFiles = e.data.payload.spec
        specFilesNew = specFiles.map(str => {
          return { value: str, label: str }
        })
        specFilesNew.unshift({ value: 'Browse...', label: 'Browse...' })
        // very bad temp timeout
        setTimeout(() => {
          solFilesArr.set(solidityFilesNew)
          specFilesArr.set(specFilesNew)
        })
        break
      case EventTypesFromExtension.EditConfFile:
        log({
          action: 'Received "edit-conf-file" command',
          source: Sources.SettingsWebview,
          info: e.data.payload,
        })
        form = confFileToFormData(e.data.payload)
        const parsedSpecFilePath = form.specFile.split('/')
        const specFileName = parsedSpecFilePath[parsedSpecFilePath.length - 1]
        submitButtonText = `Save ${
          form.mainContractName
        }.${specFileName.replace('.spec', '')}.conf`
        break
      default:
        break
    }
  }

  function createConfFile() {
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
      bind:file={form.mainSolidityFile}
    />
    <!-- 
      passing files from here to new settings 
      this guy
      files={solidityFiles}
 -->
    <OneFieldSetting
      title="Main Contract Name"
      description="Contract name"
      bind:value={form.mainContractName}
    />
    <SettingWithFilePicker
      title="Spec File"
      description="Spec file path"
      refreshButtonTitle="Update list of spec files"
      files={specFiles}
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
        >
          Run on the Staging Environment
        </vscode-checkbox>
        <vscode-text-field
          disabled={!form.useStaging}
          value={form.branch}
          on:change={e => (form.branch = e.target.value)}
        >
          Branch name
        </vscode-text-field>
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
    <div>
      <vscode-button on:click={createConfFile}>{submitButtonText}</vscode-button
      >
    </div>
  </div>
{:else}
  <RenamedMainWrapper />
{/if}

<style lang="postcss">
  /* stylelint-disable */

  :global(vscode-dropdown) {
    color: var(--dropdown-text-color);
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

  /* stylelint-disable */

  /* really bad start temporary selector */
  :global(*),
  :global(a) {
    color: var(--vscode-foreground);
  }

  /* butoon/icons hover */
  :global(.codicon-trash) {
    cursor: pointer;
    border-radius: 5px;
    padding: 2px;
  }
  :global(.codicon-trash:hover) {
    /* need to match to templates? */
    background-color: rgba(90, 93, 94, 0.31);
  }

  :global(.border-rd) {
    border-radius: 4px;
  }
  /* padding helpers */

  :global(.p-16) {
    padding: 16px;
  }
  :global(.p-12) {
    padding: 12px;
  }
  :global(.p-8) {
    padding: 8px;
  }
  :global(.pt-24) {
    padding-top: 24px;
  }
  :global(.pt-0) {
    padding-top: 0;
  }

  /* bg helpers */
  :global(.bg_dark) {
    background: var(--vscode-menu-background);
  }
  :global(.bg_light) {
    background: var(--vscode-menu-separatorBackground);
  }
  :global(.mt-8px) {
    margin-top: 8px;
  }

  :global(.btn_add) {
    background: var(--vscode-editor-background);
    border: 1px solid var(--vscode-button-secondaryBackground);
    display: flex;
    margin-top: 8px;
    transition: all 0.3s ease-in-out;
    font-size: 12px;
    padding: 2px 4px;
  }

  :global(.btn_add i) {
    font-size: 12px !important;
    margin: auto 4px auto 0;
  }
  :global(.btn_add:hover) {
    /* background: var(--vscode-button-secondaryHoverBackground); */
    background: var(--vscode-menu-background);
  }
  :global(.input_wrapper) {
    display: flex;
    gap: 8px;
  }
  :global(.input_wrapper h3 > span) {
    color: var(--vscode-charts-red);
  }
  :global(.input_wrapper h3) {
    font-size: 12px;
    font-weight: 500;
  }
  :global(.input_wrapper > div) {
    width: calc(50% - 4px);
    display: flex;
    flex-direction: column;
  }
  :global(.input_wrapper.input_single > div) {
    width: 100%;
  }

  :global(h3) {
    margin: 0 0 8px;
  }

  /* wrapper element needs 0 margin in order to avoid jumpy animation */

  :global(.most_inner_card) {
    margin: 0 8px;
    padding: 8px 0;
    border-top: 1px solid var(--vscode-menu-separatorBackground);
  }
  :global(.most_inner_card .codicon-trash) {
    margin: auto 0 5px;
  }
  :global(.border_light) {
    border-color: var(--vscode-foreground);
  }
  /* some classes here need to go */
  :global(.card_body_wrapper) {
    margin: 0;
    border-radius: 4px;
  }

  :global(.card_parent_wrapper) {
    margin-bottom: 8px;
    /* padding: 16px; */
  }

  :global(.card_body_wrapper_parent) {
    width: calc(100% - 16px);
    border-radius: 4px;
    padding: 8px;
  }
  :global(.header_contracts) {
    display: flex;
    width: 100%;
    padding: 1rem;
  }
  :global(.header_contracts h3) {
    line-height: 15px;
    margin: 0;
    text-transform: uppercase;
    font-size: 12px;
    font-weight: 500;
  }
  :global(.header_contracts .codicon-file) {
    height: min-content;
    margin: auto 3px auto 0;
  }
  :global(.header_contracts .codicon-settings) {
    height: min-content;
    margin: auto 0 auto auto;
  }

  :global(.header_contract) {
    transition: all 0.2s ease;
    display: flex;
    width: 100%;
  }

  :global(.header_contract h3) {
    font-size: 12px;
    line-height: 14px;
    font-weight: 500;
    margin: 0;
    text-transform: uppercase;
  }
  :global(.header_contract .codicon-file),
  :global(.header_contract .codicon-gear) {
    height: min-content;
    margin: auto 3px auto 0;
  }
  :global(.header_contract .codicon-chevron-up) {
    height: min-content;
    margin: auto 0 auto auto;
  }

  :global(.dark_input) {
    /* https://www.npmjs.com/package/svelte-select */
    /* https://github.com/rob-balfre/svelte-select/blob/master/docs/theming_variables.md */
    --background: var(--vscode-dropdown-background);
    --borderRadius: 0;
    --borderFocusColor: var(--vscode-inputValidation-infoBorder);
    --borderHoverColor: var(--vscode-inputValidation-infoBorder);
    --border: 1px solid transparent;

    --selectedItemPadding: 0 10px 0 8px;
    /* from dev tools */
    --inputColor: var(--vscode-foreground);
    --placeholderColor: var(--vscode-foreground);
    --placeholderOpacity: 0.4;
    --height: 30px;
    --inputPadding: 8px 4px;
    --inputFontSize: 13px;
    --inputLetterSpacing: initial;
    --padding: 6px 4px;
    --internalPadding: 0;
    --inputLetterSpacing: inherit;
    /* drop down open */
    --listBackground: var(--vscode-editor-background);
    --listBorder: 1px solid var(--vscode-button-secondaryBackground);
    --itemHoverBG: var(--vscode-editorSuggestWidget-selectedBackground);
    --itemHoverColor: var(--vscode-editorSuggestWidget-highlightForeground);
    --listShadow: 0;
    --listBorderRadius: 0;
    --itemFirstBorderRadius: 0;
    --itemPadding: 0 2px 0 16px;

    --selectedItemPadding: 0;

    /* slected active */
    --itemIsActiveBG: var(--vscode-editorSuggestWidget-selectedBackground);
    --itemISActiveColor: var(--vscode-editorSuggestWidget-highlightForeground);
    /* close icon */
    --clearSelectRight: 52px;
    --clearSelectTop: 0;
    --clearSelectBottom: 0;
    --clearSelectWidth: 20px;
  }

  :global(input.simple_txt_input) {
    cursor: default;
    border: none;
    color: var(--vscode-foreground);
    padding: 6px 4px;
    height: 18px;
    width: auto;
    background: var(--vscode-dropdown-background);
    font-size: var(--inputFontSize, 14px);
    outline-color: var(--vscode-inputValidation-infoBorder);
  }
  :global(input.simple_txt_input:hover) {
    outline: 1px solid var(--vscode-inputValidation-infoBorder);
    outline-offset: -1px;
  }

  :global(.dark_input .item) {
    position: relative;
    padding-left: 22px;
  }
  :global(.dark_input .item:before) {
    content: '\ea7b';
    font-family: 'codicon';
    position: absolute;
    top: 0;
    left: 2px;
  }
  :global(.dark_input .clearSelect) {
    background: var(--vscode-dropdown-background);
    display: flex !important;
  }

  /* error msg div */
  :global(.input_error_message) {
    background: var(--vscode-debugExceptionWidget-border);
    /* background: var(--vscode-peekViewResult-matchHighlightBackground); */
    border: 1px solid var(--vscode-editorError-foreground);
    border-radius: 4px;
    padding: 6px 8px;
    margin-top: 8px;
    display: flex;
    font-size: 12px;
    font-weight: 700;
    line-height: 15px;
  }

  :global(.input_error_message i) {
    margin-right: 4px;
  }
  :global(.input_error_message a) {
    margin-left: auto;
  }

  /* global close icon */
  :global(.codicon-close, .codicon-info, .codicon-trash) {
    border-radius: 5px;
    padding: 2px;
  }
  :global(.codicon-close:hover, .codicon-info:hover, .codicon-trash:hover) {
    cursor: pointer;
    background-color: rgba(90, 93, 94, 0.31);
  }

  :global(button:hover, input:hover) {
    cursor: pointer;
  }
</style>
