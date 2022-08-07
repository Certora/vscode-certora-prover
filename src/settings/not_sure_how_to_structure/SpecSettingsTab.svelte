<script>
  import Select from 'svelte-select'
  import ClearIcon from './slots_and_utility/ClearIcon.svelte'
  import CollapseCard from './slots_and_utility/CollapseCard.svelte'
  import CustomInput from './slots_and_utility/CustomInput.svelte'
  import Icon from './slots_and_utility/Icon.svelte'
  import { writableArray_Spec, specObj } from './stores/store.js'
  import { navState, specFilesArr, solidityObj } from './stores/store.js'
  import { refreshFiles } from '../utils/refreshFiles'
  import { log, Sources } from '../utils/log'
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

  function handleSelectSpec(event) {
    $specObj.specFile = event.detail.value
    saveOnChange()
  }
  function handleSelect(event) {}

  function handleClear() {}

  $: solDisabledState = !(
    $solidityObj.mainFile !== '' &&
    $solidityObj.mainContract !== '' &&
    $solidityObj.compiler.ver !== ''
  )

  function openBrowser(fileType) {
    log({
      action: 'Send "open-browser" command',
      source: Sources.SettingsWebview,
    })
    vscode.postMessage({
      command: 'open-browser',
      payload: fileType,
    })
  }

  function saveOnChange() {
    let form = {
      solidyObj: $solidityObj,
      specObj: $specObj,
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

<div class="card_parent_wrapper bg_dark">
  <CollapseCard
    bind:open={$navState.specCheck.active}
    resetNavProp={true}
    bind:disabledState={solDisabledState}
  >
    <div slot="header" class="header header_contracts">
      <i class="codicon codicon-file" />
      <h3>Certora spec</h3>
      <i class="codicon codicon-settings" />
      <i class="codicon codicon-chevron-up" />
    </div>
    <div slot="body">
      <div class="card_body_wrapper_parent bg_light">
        <CollapseCard>
          <div slot="header" class="header header_contract no_border_padding">
            <i class="codicon codicon-file" />
            <h3>Main SPEC FILE</h3>
            <i class="codicon codicon-chevron-up" />
          </div>
          <div slot="body" class="card_body_wrapper">
            <div class="input_wrapper" style="margin-top: 8px;">
              <div class="dark_input">
                <h3>Certore specification file<span>*</span></h3>

                <!-- refresh files when component is pressed -->
                <div on:click={refreshFiles}>
                  <Select
                    items={$specFilesArr}
                    value={$specObj.specFile}
                    {Icon}
                    {ClearIcon}
                    on:select={handleSelectSpec}
                    on:clear={handleClear}
                    placeholder=".spec file"
                  />
                </div>
                <!-- browse example -->
                <button
                  on:click={() => {
                    openBrowser('spec')
                  }}>Browse</button
                >
                <!-- <Select
                  items={$specFilesArr}
                  {Icon}
                  {ClearIcon}
                  on:select={handleSelectSpec}
                  on:clear={handleClear}
                  placeholder=".spec file"
                /> -->
              </div>
              <div class="dark_input">
                <h3>Rules<span>*</span></h3>
                <CustomInput
                  placeholder="All rules"
                  bind:bindValue={$specObj.rules}
                />
              </div>
            </div>
            <div class="input_wrapper mt-24px">
              <div class="dark_input">
                <h3>Duration</h3>
                <CustomInput
                  placeholder="600s"
                  bind:bindValue={$specObj.duration}
                />
              </div>
              <div class="dark_input">
                <h3>Inherit</h3>
                <CustomInput
                  placeholder="Another contract to inherit se..."
                  bind:bindValue={$specObj.inherit}
                />
              </div>
            </div>
            <div class="input_wrapper mt-24px">
              <div class="dark_input alternate_input">
                <label class="checkbox_container" style="margin:0"
                  >Optomistic loop
                  <input
                    type="checkbox"
                    bind:checked={$specObj.optimisticLoop}
                  />
                  <span class="checkmark" />
                </label>
              </div>
              <div
                class="dark_input alternate_input"
                style="width: auto; flex-grow:1;"
              >
                <h3>Loop Unroll</h3>
                <CustomInput
                  placeholder="0"
                  bind:bindValue={$specObj.loopUnroll}
                />
              </div>
            </div>
          </div>
        </CollapseCard>
        <div class="card_body_wrapper_parent bg_dark mt-8px">
          <CollapseCard>
            <div slot="header" class="header header_contract">
              <i class="codicon codicon-gear" />
              <h3>Additional prover settings</h3>
              <i class="codicon codicon-chevron-up" />
            </div>
            <div slot="body" class="card_body_wrapper">
              <h3>Properties</h3>
              <div class="input_wrapper">
                <div class="dark_input">
                  <CustomInput
                    placeholder="Property name"
                    bind:bindValue={$specObj.properties[0].name}
                  />
                </div>
                <div class="dark_input">
                  <CustomInput
                    placeholder="Property value"
                    bind:bindValue={$specObj.properties[0].value}
                  />
                </div>
                <i class="codicon codicon-trash" />
              </div>
              <button class="btn_add"
                ><i class="codicon codicon-add" /> Add Property</button
              >
              <div class="input_wrapper input_single">
                <div class="dark_input ">
                  <h3>Staging</h3>
                  <label class="checkbox_container"
                    >Run on the Staging Environment
                    <input type="checkbox" bind:checked={$specObj.runOnStg} />
                    <span class="checkmark" />
                  </label>
                </div>
              </div>
              <div class="input_wrapper input_single">
                <div class="dark_input">
                  <h3>Branch Name</h3>
                  <CustomInput
                    placeholder="default: master"
                    bind:bindValue={$specObj.branchName}
                  />
                </div>
              </div>
              <div class="input_wrapper check_between">
                <div class="dark_input alternate_input ">
                  <label class="checkbox_container"
                    >Local type checking
                    <input
                      type="checkbox"
                      bind:checked={$specObj.localTypeChecking}
                    />
                    <span class="checkmark" />
                  </label>
                </div>
                <div class="dark_input alternate_input">
                  <label class="checkbox_container"
                    >Short output
                    <input
                      type="checkbox"
                      bind:checked={$specObj.shortOutput}
                    />
                    <span class="checkmark" />
                  </label>
                </div>
                <div class="dark_input alternate_input">
                  <label class="checkbox_container"
                    >Multi assert
                    <input
                      type="checkbox"
                      bind:checked={$specObj.multiAssert}
                    />
                    <span class="checkmark" />
                  </label>
                </div>
              </div>
            </div>
          </CollapseCard>
        </div>
      </div>
    </div>
  </CollapseCard>
</div>

<style>
  /* stylelint-disable */

  .mt-24px {
    margin-top: 24px;
  }
  .check_between {
    justify-content: space-between;
    margin-top: 8px;
    padding-top: 14px;
    border-top: 1px solid var(--vscode-menu-separatorBackground);
  }
  .check_between .alternate_input {
    width: fit-content;
  }
  .alternate_input {
    flex-direction: row;
    align-items: center;
    font-size: 13px;
  }

  .alternate_input h3 {
    white-space: nowrap;
    width: max-content;
    font-size: 13px;
    margin: auto 8px auto 0;
  }
  :global(.alternate_input div) {
    flex-grow: 1;
  }
  /* The checkbox_container */
  .checkbox_container {
    display: block;
    position: relative;
    padding-left: 30px;
    margin-bottom: 12px;
    cursor: pointer;
    font-size: 13px;
    -webkit-user-select: none;
    -moz-user-select: none;
    -ms-user-select: none;
    user-select: none;
  }

  /* Hide the browser's default checkbox */
  .checkbox_container input {
    position: absolute;
    opacity: 0;
    cursor: pointer;
    height: 0;
    width: 0;
  }

  /* Create a custom checkbox */
  .checkmark {
    position: absolute;
    top: 0;
    left: 0;
    height: 18px;
    width: 18px;
    background-color: var(--vscode-dropdown-background);
    border-radius: 4px;
  }

  /* On mouse-over, add a grey background color */
  .checkbox_container:hover input ~ .checkmark {
    /* background-color: #ccc; */
  }

  /* When the checkbox is checked, add a blue background */
  .checkbox_container input:checked ~ .checkmark {
    /* background-color: #2196F3; */
  }

  /* Create the checkmark/indicator (hidden when not checked) */
  .checkmark:after {
    content: '';
    position: absolute;
    display: none;
  }

  /* Show the checkmark when checked */
  .checkbox_container input:checked ~ .checkmark:after {
    display: block;
  }

  /* Style the checkmark/indicator */
  .checkbox_container .checkmark:after {
    left: 6px;
    top: 1px;
    width: 4px;
    height: 10px;
    border: solid var(--vscode-foreground);
    border-width: 0 2px 2px 0;
    -webkit-transform: rotate(45deg);
    -ms-transform: rotate(45deg);
    transform: rotate(45deg);
  }
</style>
