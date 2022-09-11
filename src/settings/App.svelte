<script lang="ts">
  import { onMount, onDestroy } from 'svelte'
  import { log, Sources } from './utils/log'
  import { EventTypesFromExtension, EventsFromExtension } from './types'
  import RenamedMainWrapper from './not_sure_how_to_structure/RenamedMainWrapper.svelte'

  import {
    solFilesArr,
    specFilesArr,
  } from './not_sure_how_to_structure/stores/store.js'

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
  }

  onMount(() => {
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

  /* :global(body) {
    padding: 0 16px;
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
    color: var(--button-primary-foreground) !important;
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
</style>
