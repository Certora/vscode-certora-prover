<script>
  import Select from 'svelte-select'
  import ClearIcon from './slots_and_utility/ClearIcon.svelte'
  import CollapseCard from './slots_and_utility/CollapseCard.svelte'
  import Icon from './slots_and_utility/Icon.svelte'
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
</script>

<!-- {#if favouriteFood}
	<p>Favourite food is: {favouriteFood.label}</p>
{/if} -->

<div class="card_parent_wrapper bg_dark">
  <CollapseCard>
    <div slot="header" class="header header_contracts">
      <i class="codicon codicon-file" />
      <h3>Solidity contracts</h3>
      <i class="codicon codicon-settings" />
      <i class="codicon codicon-chevron-up" />
    </div>
    <div slot="body">
      <div class="card_body_wrapper_parent bg_light">
        <CollapseCard>
          <div slot="header" class="header header_contract no_border_padding">
            <i class="codicon codicon-file" />
            <h3>Main contract</h3>
            <i class="codicon codicon-chevron-up" />
          </div>
          <div slot="body" class="card_body_wrapper">
            <div class="input_wrapper" style="margin-top: 8px;">
              <div class="dark_input">
                <h3>Source<span>*</span></h3>
                <Select
                  {items}
                  {Icon}
                  {ClearIcon}
                  on:select={handleSelect}
                  on:clear={handleClear}
                  placeholder="Main solidity file"
                />
              </div>
              <div class="dark_input">
                <h3>Main contract name<span>*</span></h3>
                <Select
                  {items}
                  {Icon}
                  {ClearIcon}
                  on:select={handleSelect}
                  on:clear={handleClear}
                  placeholder="className()"
                />
              </div>
            </div>

            <div class="card_body_wrapper_parent bg_dark mt-8px">
              <CollapseCard>
                <div slot="header" class="header header_contract">
                  <i class="codicon codicon-gear" />
                  <h3>Linking</h3>
                  <i class="codicon codicon-chevron-up" />
                </div>
                <div slot="body" class="card_body_wrapper">
                  <div class="input_wrapper">
                    <div class="dark_input">
                      <Select
                        {items}
                        {Icon}
                        {ClearIcon}
                        on:select={handleSelect}
                        on:clear={handleClear}
                        placeholder="Variable"
                      />
                    </div>
                    <div class="dark_input">
                      <Select
                        {items}
                        {Icon}
                        {ClearIcon}
                        on:select={handleSelect}
                        on:clear={handleClear}
                        placeholder="Contract name"
                      />
                    </div>
                    <i class="codicon codicon-trash" />
                  </div>

                  <button class="btn_add"
                    ><i class="codicon codicon-add" /> Add Link</button
                  >
                </div>
              </CollapseCard>
            </div>
            <div class="card_body_wrapper_parent bg_dark mt-8px">
              <CollapseCard>
                <div slot="header" class="header header_contract">
                  <i class="codicon codicon-gear" />
                  <h3>Specific method</h3>
                  <i class="codicon codicon-chevron-up" />
                </div>
                <div slot="body" class="card_body_wrapper">
                  <div class="input_wrapper input_wrapper_single">
                    <div class="dark_input">
                      <h3 for="food">Function name</h3>
                      <Select
                        {items}
                        {Icon}
                        {ClearIcon}
                        on:select={handleSelect}
                        on:clear={handleClear}
                        placeholder="method_name()"
                      />
                    </div>
                  </div>
                </div>
              </CollapseCard>
            </div>
            <div class="card_body_wrapper_parent bg_dark mt-8px">
              <CollapseCard>
                <div slot="header" class="header header_contract">
                  <i class="codicon codicon-gear" />
                  <h3>Compiler</h3>
                  <i class="codicon codicon-chevron-up" />
                </div>
                <div slot="body" class="card_body_wrapper">
                  <div class="input_wrapper">
                    <div class="dark_input">
                      <h3>
                        Directory containing solidity packages<span>*</span>
                      </h3>
                      <Select
                        {items}
                        {Icon}
                        {ClearIcon}
                        on:select={handleSelect}
                        on:clear={handleClear}
                        placeholder="CVT-Executables-Mac"
                      />
                    </div>
                    <div class="dark_input">
                      <h3>Default soldity version to use<span>*</span></h3>
                      <!-- no placeholder, this filed should have the default compiler selected by default -->
                      <Select
                        {items}
                        {Icon}
                        {ClearIcon}
                        on:select={handleSelect}
                        on:clear={handleClear}
                        placeholder="version: solc7.6"
                      />
                    </div>
                    <i class="codicon codicon-trash" />
                  </div>

                  <div>some error</div>
                </div>
              </CollapseCard>
            </div>
          </div>
        </CollapseCard>
      </div>

      <button class="btn_add"
        ><i class="codicon codicon-add" /> Add another contract</button
      >
    </div>
  </CollapseCard>
</div>

<style>
  /* stylelint-disable */

  /* really bad start temporary selector */
  * {
    color: var(--vscode-foreground);
  }
  /* bg helpers */
  .bg_dark {
    background: var(--vscode-menu-background);
  }
  .bg_light {
    background: var(--vscode-menu-separatorBackground);
  }
  .mt-8px {
    margin-top: 8px;
  }

  .btn_add {
    background: var(--vscode-editor-background);
    border: 1px solid var(--vscode-button-secondaryBackground);
    display: flex;
    margin-top: 8px;
    transition: all 0.3s ease-in-out;
    font-size: 12px;
    padding: 2px 4px;
  }

  .btn_add i {
    font-size: 12px;
    margin: auto 4px auto 0;
  }
  .btn_add:hover {
    /* background: var(--vscode-button-secondaryHoverBackground); */
    background: var(--vscode-menu-background);
  }
  .input_wrapper {
    display: flex;
    gap: 8px;
  }
  .input_wrapper h3 > span {
    color: var(--vscode-charts-red);
  }
  .input_wrapper h3 {
    font-size: 12px;
    font-weight: 500;
  }
  .input_wrapper > div {
    width: calc(50% - 4px);
    display: flex;
    flex-direction: column;
  }

  .input_wrapper_single {
    width: calc(100% - 8px);
  }
  h3 {
    margin: 0 0 8px;
  }

  /* wrapper element needs 0 margin in order to avoid jumpy animation */
  .card_body_wrapper {
    margin: 0;
  }
  .card_body_wrapper .codicon-trash {
    margin: auto -1px 1px 0;
  }
  .card_parent_wrapper {
    border-radius: 4px;
    margin-bottom: 8px;
    padding: 16px;
  }

  .card_body_wrapper_parent {
    width: calc(100% - 16px);
    border-radius: 4px;
    padding: 8px;
  }
  .header_contracts {
    display: flex;
    width: 100%;
    margin-bottom: 12px;
  }
  .header_contracts h3 {
    line-height: 15px;
    margin: 0;
    text-transform: uppercase;
  }
  .header_contracts .codicon-file {
    height: min-content;
    margin: auto 3px auto 0;
  }
  .header_contracts .codicon-settings {
    height: min-content;
    margin: auto 0 auto auto;
  }
  .header_contracts .codicon-chevron-up {
    height: min-content;
    margin: auto 0 auto 6px;
  }
  .header_contract {
    transition: all 0.2s ease;
    display: flex;
    width: 100%;
  }

  :global(.card.open
      > .card-header
      > .header_contract:not(.no_border_padding)) {
    padding-bottom: 8px;
    border-bottom: 1px solid var(--vscode-menu-separatorBackground);
    margin-bottom: 8px;
  }
  .header_contract h3 {
    font-size: 12px;
    line-height: 14px;
    font-weight: 500;
    margin: 0;
    text-transform: uppercase;
  }
  .header_contract .codicon-file,
  .header_contract .codicon-gear {
    height: min-content;
    margin: auto 3px auto 0;
  }
  .header_contract .codicon-chevron-up {
    height: min-content;
    margin: auto 0 auto auto;
  }

  .dark_input {
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
    --height: 18px;
    --inputPadding: 8px 4px;
    --inputFontSize: 13px;
    --inputLetterSpacing: initial;
    --padding: 6px 4px;
    --internalPadding: 0;

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
    --clearSelectRight: 0;
    --clearSelectTop: 0;
    --clearSelectBottom: 0;
    --clearSelectWidth: 16px;
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
</style>
