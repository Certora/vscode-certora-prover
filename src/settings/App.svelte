<script lang="ts">
  /* ---------------------------------------------------------------------------------------------
   *  Settings view main file. It consists of all the components of the settings form.
   *-------------------------------------------------------------------------------------------- */

  import { onMount, onDestroy } from 'svelte'
  // new cutting edge stuff
  import { log, Sources } from './utils/log'
  import { confFileToFormData } from './utils/confFileToFormData'
  import type { NewForm } from './types'
  import { EventTypesFromExtension, EventsFromExtension } from './types'
  import RenamedMainWrapper from './RenamedMainWrapper.svelte'

  import {
    solFilesArr,
    specFilesArr,
    solidityObj,
    specObj,
    verification_message,
    solAdditionalContracts,
    RunName,
  } from './stores/store.js'
  import { refreshFiles } from './utils/refreshFiles'

  function fillFields(newForm: NewForm) {
    $solidityObj = newForm.solidyObj
    $specObj = newForm.specObj
    $verification_message = newForm.verificatoinMessage
    $solAdditionalContracts = newForm.solidityAdditionalContracts || []
  }

  const listener = (e: MessageEvent<EventsFromExtension>) => {
    if (e.data.type === EventTypesFromExtension.SmartContractsFilesUpdated) {
      log({
        action: 'Received "smart-contracts-files-updated" command',
        source: Sources.SettingsWebview,
        info: e.data.payload,
      })
      $solFilesArr = e.data.payload.sol
      $specFilesArr = e.data.payload.spec
    }
    if (e.data.type === EventTypesFromExtension.notifyWebviewAboutUpdates) {
      log({
        action: 'Received "notifyWebviewAboutUpdates" command',
        source: Sources.SettingsWebview,
        info: e.data.payload,
      })

      if (e.data.payload.method === 'push') {
        if (e.data.payload.file.type === '.sol') {
          $solFilesArr = [...$solFilesArr, e.data.payload.file]
          return
        }
        $specFilesArr = [...$specFilesArr, e.data.payload.file]
      }
      if (e.data.payload.method === 'filter') {
        let file = e.data.payload.file
        if (e.data.payload.file.type === '.sol') {
          $solFilesArr = $solFilesArr.filter(f => f.value !== file.value)
          return
        }
        $specFilesArr = $specFilesArr.filter(f => f.value !== file.value)
      }
    }
    if (e.data.type === EventTypesFromExtension.EditConfFile) {
      log({
        action: 'Received "edit-conf-file" command',
        source: Sources.SettingsWebview,
        info: e.data.payload,
      })
      $RunName = e.data.payload.runName
      let newForm: NewForm = confFileToFormData(e.data.payload.confFile) // change the conf file info form data for the settings form
      fillFields(newForm)
    }
    if (e.data.type === EventTypesFromExtension.FileChosen) {
      log({
        action: 'Received "file-chosen" command',
        source: Sources.SettingsWebview,
        info: e.data.payload,
      })
      const fileName = e.data.payload.file
      const contractName = fileName
        .toString()
        .split('/')
        .reverse()[0]
        .replace('.sol', '')
      const index = e.data.payload.index
      if (fileName.endsWith('.sol')) {
        if (index === -1) {
          $solidityObj.mainFile = fileName
          $solidityObj.mainContract = contractName
        } else if ($solAdditionalContracts.length > index) {
          $solAdditionalContracts[index].mainFile = fileName
          $solAdditionalContracts[index].mainContract = contractName
        }
      } else if (fileName.endsWith('.spec')) {
        $specObj.specFile = fileName
      }
    }
  }

  onMount(() => {
    refreshFiles()
    window.addEventListener('message', listener)
  })

  onDestroy(() => {
    window.removeEventListener('message', listener)
  })
</script>

<RenamedMainWrapper />

<style lang="postcss">
  /* stylelint-disable */

  :global(vscode-dropdown) {
    color: var(--dropdown-text-color);
  }

  :global(body) {
    padding: 44px 24px;
  }

  :global(body.vscode-dark) {
    --dropdown-text-color: var(--dropdown-foreground);
  }

  /* stylelint-disable */

  /* really bad start temporary selector */
  /* :global(*),
  :global(a) {
    color: var(--button-primary-foreground) !important;
  } */

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
    /* background: var(--vscode-tab-inactiveBackground); */
    color: var(--vscode-editor-foreground);
    fill: var(--vscode-editor-foreground);
  }
  :global(.bg_light) {
    background: var(--badge-background);
    /* background: var(--vscode-menu-separatorBackground); */
    color: var(--vscode-button-foreground);
    fill: var(--vscode-button-foreground);
  }
  :global(.showtxt) {
    color: var(--vscode-editor-foreground);
  }
  /* :global(.selectContainer input::placeholder) {
    color: var(--vscode-input-placeholderForeground)!important;
  } */
  :global(.mt-8px) {
    margin-top: 8px;
  }

  :global(.btn_add) {
    background: var(--vscode-button-secondaryBackground);
    border: 1px solid var(--vscode-button-secondaryBackground);
    color: var(--vscode-button-secondaryForeground);
    display: flex;
    margin-top: 8px;
    /* transition: all 0.3s ease-in-out; */
    font-size: 12px;
    padding: 2px 4px;
  }

  :global(.btn_add i) {
    font-size: 12px !important;
    margin: auto 4px auto 0;
  }
  :global(.btn_add:hover) {
    background: var(--vscode-button-secondaryHoverBackground);
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
    margin: 6px 0 auto;
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
  :global(.header_contracts i:first-of-type) {
    height: min-content;
    max-height: 16px;
    margin: auto 3px auto 0;
  }
  :global(.header_contracts i:first-of-type path) {
    fill: inherit;
  }
  :global(.header_contracts .codicon-settings) {
    height: min-content;
    margin: auto 0 auto auto;
  }

  :global(.header_contract) {
    /* transition: all 0.2s ease; */
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
    --background: var(--vscode-input-background);
    --borderRadius: 0;
    --borderFocusColor: var(--vscode-inputValidation-infoBorder);
    --borderHoverColor: var(--vscode-inputValidation-infoBorder);
    --border: 1px solid transparent;

    --selectedItemPadding: 0 10px 0 8px;
    /* from dev tools */
    --inputColor: var(--vscode-input-foreground);
    --placeholderColor: var(--vscode-input-placeholderForeground);
    --placeholderOpacity: 1;
    --height: 30px;
    --inputPadding: 6px 52px 6px 4px;
    --inputFontSize: 13px;
    --inputLetterSpacing: initial;
    --padding: 6px 4px;
    --internalPadding: 0;
    --inputLetterSpacing: inherit;
    /* drop down open */
    --listBackground: var(--vscode-editorSuggestWidget-background);
    /* --listBorder: 1px solid var(--vscode-list-focusOutline); */
    /* --listBorder: 1px solid var(--vscode-button-secondaryBackground); */

    /* --vscode-editorSuggestWidget-background: #252526;
    --vscode-editorSuggestWidget-border: #454545;
    --vscode-editorSuggestWidget-foreground: #d4d4d4;
    --vscode-editorSuggestWidget-selectedForeground: #ffffff;
    --vscode-editorSuggestWidget-selectedIconForeground: #ffffff;
    --vscode-editorSuggestWidget-selectedBackground: #094771;
    --vscode-editorSuggestWidget-highlightForeground: #18a3ff;
    --vscode-editorSuggestWidget-focusHighlightForeground: #18a3ff; */

    --itemHoverBG: var(--vscode-editorSuggestWidget-border);
    --itemHoverColor: var(--vscode-editorSuggestWidget-foreground);
    --itemColor: var(--vscode-editorSuggestWidget-foreground);
    --listShadow: 0;
    --listBorderRadius: 0;
    --itemFirstBorderRadius: 0;
    --itemPadding: 0 2px 0 16px;

    --selectedItemPadding: 0;
    --listLeft: -2px;
    /* slected active */
    --itemIsActiveBG: var(--vscode-editorSuggestWidget-selectedBackground);
    --itemISActiveColor: var(--vscode-editorSuggestWidget-selectedForeground);
    /* close icon */
    --clearSelectRight: 52px;
    --clearSelectTop: 0;
    --clearSelectBottom: 0;
    --clearSelectWidth: 20px;
    --clearSelectFocusColor: var(--vscode-input-foreground);
    --inputColor: var(--vscode-input-foreground);
  }

  :global(.selectContainer) {
    gap: 24px;
  }
  :global(.selectContainer > input) {
    box-sizing: border-box;
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
    font-weight: 500;
    line-height: 15px;
    position: absolute;
    width: -webkit-fill-available;
    z-index: 2;
  }

  :global(.input_error_message i) {
    margin: auto 8px auto 0;
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

  @media (max-width: 470px) {
    :global(.input_wrapper) {
      flex-direction: column;
    }
    :global(.input_wrapper > div) {
      width: 100%;
    }
    :global(.input_wrapper > .codicon-trash) {
      width: min-content;
    }
  }

  :global(a) {
    color: var(--link-foreground);
  }

  /* colors light/dark */

  /* light */
  /* :global(.vscode-light .bg_light .bg_dark  input){
    outline: 1px solid transparent !important;;
  } */
  :global(.vscode-light
      .bg_dark
      .bg_light
      .simple_txt_input, .vscode-high-contrast-light
      .bg_dark
      .bg_light
      .simple_txt_input, .vscode-high-contrast-light
      .selectContainer, .vscode-light .selectContainer) {
    outline: 1px solid var(--vscode-inputValidation-infoBorder);
    outline-offset: -1px;
  }
  :global(.vscode-light .bg_dark, .vscode-high-contrast-light .bg_dark) {
    background: var(--badge-background);
    color: var(--vscode-button-foreground);
    fill: var(--vscode-button-foreground);
  }
  :global(.vscode-light .bg_light, .vscode-high-contrast-light .bg_light) {
    background: var(--vscode-menu-background);
    color: var(--vscode-editor-foreground);
    fill: var(--vscode-editor-foreground);
  }
  :global(.vscode-high-contrast-light .dark_input) {
    --itemHoverColor: white !important;
  }
  :global(.vscode-high-contrast-light) {
    --vscode-button-secondaryHoverBackground: white !important;
  }

  /* high contrast */
  :global(.vscode-high-contrast .bg_dark, .vscode-high-contrast
      .bg_light, .vscode-high-contrast
      .nav_settings
      .nav_settings_child, .vscode-high-contrast .btn_add) {
    border: 1px solid var(--vscode-menu-separatorBackground);
  }
  :global(.vscode-high-contrast .simple_txt_input, .vscode-high-contrast
      .checkmark, .vscode-high-contrast .nav_settings_child) {
    outline: 1px solid var(--vscode-inputValidation-infoBorder);
    outline-offset: -1px;
  }

  :global(.vscode-high-contrast .simple_txt_input:hover, .vscode-high-contrast
      .checkmark:hover) {
    outline-color: var(--vscode-list-focusOutline) !important;
    outline-style: dashed !important;
  }
  :global(.vscode-high-contrast .selectContainer) {
    border: 1px solid var(--vscode-inputValidation-infoBorder) !important;
    /* outline-offset: -1px; */
  }
  :global(.vscode-high-contrast .selectContainer:hover) {
    border-color: var(--vscode-list-focusOutline) !important;
    border-style: dashed !important;
  }

  :global(.vscode-high-contrast
      button:not(.btn_add):hover, .vscode-high-contrast
      div:not(.header)
      > .codicon:hover, .vscode-high-contrast .codicon-trash:hover) {
    border-radius: 4px;
    outline: 1px dashed var(--vscode-list-focusOutline) !important;
    outline-offset: -1px;
  }
  :global(.vscode-high-contrast
      button:not(.btn_add):active, .vscode-high-contrast
      .nav_settings_child.active, .vscode-high-contrast
      div:not(.header)
      > .codicon:active, .vscode-high-contrast .codicon-trash:active) {
    outline-style: solid !important;
    outline-color: var(--vscode-list-focusOutline);
  }
  :global(.vscode-high-contrast .btn_add:hover) {
    border: 1px dashed var(--vscode-list-focusOutline) !important;
    border-offset: -1px;
  }
  :global(.vscode-high-contrast .btn_add:active) {
    border-style: solid !important;
  }
  :global(.vscode-high-contrast .simple_txt_input:focus, .vscode-high-contrast
      .checkmark:focus) {
    outline-color: var(--vscode-list-focusOutline) !important;
  }
  :global(.vscode-high-contrast .selectContainer.focused) {
    border-color: var(--vscode-list-focusOutline) !important;
  }

  /* dark themes input fix */
  :global([data-vscode-theme-name='Tomorrow Night Blue']
      .selectContainer, [data-vscode-theme-name='Abyss']
      .selectContainer, [data-vscode-theme-name='Red'] .selectContainer) {
    border: 1px solid var(--vscode-inputValidation-infoBorder) !important;
  }
  :global([data-vscode-theme-name='Tomorrow Night Blue']
      .simple_txt_input, [data-vscode-theme-name='Abyss']
      .simple_txt_input, [data-vscode-theme-name='Red'] .simple_txt_input) {
    outline: 1px solid var(--vscode-inputValidation-infoBorder);
    outline-offset: -1px;
  }
  :global([data-vscode-theme-name='Tomorrow Night Blue']
      .checkmark, [data-vscode-theme-name='Abyss']
      .checkmark, [data-vscode-theme-name='Red'] .checkmark) {
    outline: 1px solid var(--vscode-inputValidation-infoBorder);
    outline-offset: -1px;
  }

  :global(.listContainer.svelte-uv3qci, .listContainer.svelte-1uyqfml, .listContainer) {
    left: -2px !important;
    outline: 1px solid var(--vscode-editorSuggestWidget-border);
    max-width: calc(100vw - 73px) !important;
    width: fit-content !important;
  }

  :global(body, html) {
    height: 100vh;
    overflow-y: hidden;
  }
</style>
