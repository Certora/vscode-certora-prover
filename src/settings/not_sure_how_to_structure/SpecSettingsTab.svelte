<script>
  import Select from 'svelte-select'
  import ClearIcon from './slots_and_utility/ClearIcon.svelte'
  import CollapseCard from './slots_and_utility/CollapseCard.svelte'
  import CustomInput from './slots_and_utility/CustomInput.svelte'
  import Icon from './slots_and_utility/Icon.svelte'
  import { log, Sources } from '../utils/log'

  import CustomItem from './slots_and_utility/CustomItem.svelte'
  import {
    navState,
    specObj,
    solidityObj,
    verification_message,
    specFilesArr,
    solAdditionalContracts,
  } from './stores/store.js'
  import CheckBoxInfo from './slots_and_utility/CheckBoxInfo.svelte'
  import { refreshFiles } from '../utils/refreshFiles'

  // this items arrary contains all the solidity files and should update on when updateItems is fired
  // some fake stuff
  // ********** IMPORTANT **********
  // ********** FIRST OBJECT IN THE ARRAY MUST BE { value: 'Browse...', label: 'Browse...', path: 'src/somefolder' }
  // this brows object is needed to fire up a function to browse files (the path key is useless but might as well)
  $: specFiles = [
    { value: 'Browse...', label: 'Browse...', path: 'src/somefolder' },
    { value: 'src/somefolder/file-1', label: 'file-1', path: 'src/somefolder' },
    {
      value: 'file-2/src/somefolder1',
      label: 'file-2',
      path: 'src/somefolder1',
    },
    {
      value: 'file-3/src/somefolder2',
      label: 'file-3',
      path: 'src/somefolder2',
    },
    {
      value: 'file-4/src/somefolder3',
      label: 'file-4',
      path: 'src/somefolder3',
    },
    {
      value: 'file-5/src/somefolder4',
      label: 'file-5',
      path: 'src/somefolder4',
    },
    {
      value: 'file-6/src/somefolder5',
      label: 'file-6',
      path: 'src/somefolder5',
    },
  ]

  let infoObjArr = {
    specFile: {
      infoText: 'pick spec file',
      infoLink:
        'https://docs.certora.com/en/latest/docs/ref-manual/cli/options.html',
    },
    rules: {
      infoText:
        'Formally verifies one or more given properties instead of the whole specification file. An invariant can also be selected.',
      infoLink:
        'https://docs.certora.com/en/latest/docs/ref-manual/cli/options.html#rules',
      validator: 'spaceAndDash',
    },
    duration: {
      infoText: 'Sets the maximal timeout for all the SMT solvers.',
      infoLink:
        'https://docs.certora.com/en/latest/docs/ref-manual/cli/options.html#smt-timeout',
      validator: 'number',
    },
    optimistic_loop: {
      infoText:
        'The Certora Prover unrolls loops - if the loop should be executed three times, it will copy the code inside the loop three times. After we finish the loop’s iterations, we add an assertion to verify we have actually finished running the loop',
      infoLink:
        'https://docs.certora.com/en/latest/docs/ref-manual/cli/options.html#optimistic-loop',
    },
    loop_iter: {
      infoText:
        'The Certora Prover unrolls loops - if the loop should be executed three times, it will copy the code inside the loop three times. After we finish the loop’s iterations, we add an assertion to verify we have actually finished running the loop',
      infoLink:
        'https://docs.certora.com/en/latest/docs/ref-manual/cli/options.html#loop-iter',
      validator: 'number',
    },
    flag: {
      infoText:
        'additional flags - you can find all available flags in the documentation',
      infoLink:
        'https://docs.certora.com/en/latest/docs/ref-manual/cli/options.html',
      validator: 'alphaNum',
    },
    stg: {
      infoText: 'run on staging environment',
      infoLink:
        'https://docs.certora.com/en/latest/docs/ref-manual/cli/options.html',
      validator: 'alphaNum',
    },
    typecheck_only: {
      infoText:
        'Stops after running the Solidity compiler and type checking of the spec, before submitting the verification task.',
      infoLink:
        'https://docs.certora.com/en/latest/docs/ref-manual/cli/options.html#typecheck-only',
    },
    short_output: {
      infoText: 'Reduces the verbosity of the tool.',
      infoLink:
        'https://docs.certora.com/en/latest/docs/ref-manual/cli/options.html#short-output',
    },
    multi_assert_check: {
      infoText:
        'This mode checks each assertion statement that occurs in a rule, separately.',
      infoLink:
        'https://docs.certora.com/en/latest/docs/ref-manual/cli/options.html#multi-assert-check',
    },
  }
  // on click on the input get al the files (sol or spec) based on what os passded to the function
  function updateItems(fileType) {
    // not really expecting anything but sol here
    // might bove elsewhere later and make it more reusable
    if (fileType !== 'spec') return
    // this is actually pushing some fake value in (for testing only) just replace with an array of the new values from the file system like you see in the specFiles
    specFiles = [
      ...specFiles,
      { value: 'Browse...', label: 'Browse...', path: 'src/somefolder' },
    ]
  }

  function handleSelectSpec(event, fileType, index) {
    if (event.detail.value === 'Browse...') {
      loadFilesFolder(fileType, index)
      return
    }
    $specObj.specFile = event.detail
    saveOnChange()
  }

  function handleClear(e, index) {
    $specObj.specFile = ''
    saveOnChange()
  }
  // add files from folder
  function loadFilesFolder(fileType, index) {
    openBrowser(fileType, index)
  }

  function openBrowser(fileType, index = -1) {
    log({
      action: 'Send "open-browser" command',
      source: Sources.SettingsWebview,
    })
    vscode.postMessage({
      command: 'open-browser',
      payload: [fileType, index],
    })
  }

  $: solDisabledState = !(
    $solidityObj.mainFile !== '' &&
    $solidityObj.mainContract !== '' &&
    $solidityObj.compiler.ver !== ''
  )

  function saveOnChange() {
    let form = {
      solidyObj: $solidityObj,
      specObj: $specObj,
      verificatoinMessage: $verification_message,
      solidityAdditionalContracts: $solAdditionalContracts,
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

  // push new linking/directory
  function pushNewObj(arr, obj) {
    arr.push(obj)
    $specObj = $specObj
    saveOnChange()
  }
  // remove from linking/directory
  function removeObj(arr, index) {
    arr.splice(index, 1)
    $specObj = $specObj
    saveOnChange()
  }

  let isSpecListOpen = false
  // icon props expect an object
  let specIconsObj = {
    // bind to some variable later to check if the input is selected
    // logic for later only show info icon when selected
    // passing just the function and the info icon text for now
    selected: isSpecListOpen,
    loadFilesFolder: loadFilesFolder,
    fileType: 'spec',
    ifoText: infoObjArr.specFile.infoText,
    infoLink: infoObjArr.specFile.infoLink,
  }
</script>

<div class="card_parent_wrapper bg_dark border-rd">
  <CollapseCard
    chevron="padding-right:16px;"
    bind:open={$navState.specCheck.active}
    resetNavProp={true}
    bind:disabledState={solDisabledState}
  >
    <div slot="header" class="header header_contracts">
      <i class="codicon codicon-file" />
      <h3>Certora spec</h3>
      <!-- <i class="codicon codicon-settings" /> -->
    </div>
    <div slot="body" class="p-16 pt-0">
      <div class="bg_light border-rd">
        <CollapseCard chevron="padding-right:12px;">
          <div slot="header" class="p-12 header header_contract">
            <i class="codicon codicon-file" />
            <h3>Main SPEC FILE</h3>
          </div>
          <div slot="body" class="p-12 pt-0">
            <div class="input_wrapper">
              <div class="dark_input">
                <h3>Certora specification file<span>*</span></h3>
                <button
                  on:click={() => refreshFiles()}
                  style="background: transparent; padding:0; border:none; margin-top:auto;"
                >
                  <Select
                    listOpen={isSpecListOpen}
                    iconProps={specIconsObj}
                    items={$specFilesArr}
                    Item={CustomItem}
                    {Icon}
                    {ClearIcon}
                    on:select={e => handleSelectSpec(e, 'spec')}
                    on:clear={e => handleClear(e)}
                    placeholder=".spec file"
                    bind:value={$specObj.specFile}
                  />
                </button>
              </div>
              <div class="dark_input">
                <h3>Rules</h3>
                <CustomInput
                  placeholder="All rules"
                  bind:bindValue={$specObj.rules}
                  change={saveOnChange}
                  infoObj={infoObjArr.rules}
                />
              </div>
            </div>
            <div class="input_wrapper mt-24px">
              <div class="dark_input input_x3">
                <h3>Duration</h3>
                <CustomInput
                  placeholder="600s"
                  bind:bindValue={$specObj.duration}
                  change={saveOnChange}
                  infoObj={infoObjArr.duration}
                />
              </div>

              <div
                class="dark_input check_box_wrapper input_x3"
                style="margin: auto 16px 8px auto;"
              >
                <label class="checkbox_container" style="margin: 0;">
                  Optomistic loop
                  <input
                    type="checkbox"
                    bind:checked={$specObj.optimisticLoop}
                    on:change={saveOnChange}
                  />
                  <span class="checkmark" />
                </label>
                <CheckBoxInfo infoObj={infoObjArr.optimistic_loop} />
              </div>
              <div class="dark_input input_x3">
                <h3>Loop Unroll</h3>
                <CustomInput
                  placeholder="1"
                  bind:bindValue={$specObj.loopUnroll}
                  change={saveOnChange}
                  infoObj={infoObjArr.loop_iter}
                />
              </div>
            </div>
            <div class="border-rd bg_dark mt-8px">
              <CollapseCard open={false} chevron="padding-right:8px;">
                <div slot="header" class="p-8 header header_contract">
                  <i class="codicon codicon-gear" />
                  <h3>Additional prover settings</h3>
                </div>
                <div slot="body" class="most_inner_card">
                  <h3 class="header_single">Additional flags</h3>

                  {#each $specObj.properties as obj, index}
                    <div class="input_wrapper mt-8px">
                      <div class="dark_input">
                        <CustomInput
                          placeholder="Property name"
                          bind:bindValue={obj.name}
                          change={saveOnChange}
                          infoObj={infoObjArr.flag}
                        />
                      </div>
                      <div class="dark_input">
                        <CustomInput
                          placeholder="Property value"
                          bind:bindValue={obj.value}
                          change={saveOnChange}
                          infoObj={infoObjArr.flag}
                        />
                      </div>
                      <i
                        class="codicon codicon-trash"
                        on:click={removeObj($specObj.properties, index)}
                      />
                    </div>
                  {/each}
                  <button
                    class="btn_add"
                    on:click={pushNewObj($specObj.properties, {
                      name: '',
                      value: '',
                    })}><i class="codicon codicon-add" /> Add Flag</button
                  >
                  <h3 class="header_single mt-8px">Staging</h3>
                  <div class="input_wrapper input_single mt-8px">
                    <div class="dark_input check_box_wrapper">
                      <label class="checkbox_container"
                        >Run on the Staging Environment
                        <input
                          type="checkbox"
                          bind:checked={$specObj.runOnStg}
                          on:change={saveOnChange}
                        />
                        <span class="checkmark" />
                      </label>
                      <CheckBoxInfo infoObj={infoObjArr.stg} />
                    </div>
                  </div>
                  <div class="input_wrapper input_single">
                    <div class="dark_input">
                      <h3>Branch Name</h3>
                      <CustomInput
                        placeholder="default: master"
                        bind:bindValue={$specObj.branchName}
                        change={saveOnChange}
                        infoObj={infoObjArr.stg}
                      />
                    </div>
                  </div>
                  <div class="input_wrapper check_between ">
                    <div class="dark_input alternate_input  check_box_wrapper">
                      <label class="checkbox_container"
                        >Local type checking
                        <input
                          type="checkbox"
                          bind:checked={$specObj.localTypeChecking}
                          on:change={saveOnChange}
                        />
                        <span class="checkmark" />
                      </label>
                      <CheckBoxInfo infoObj={infoObjArr.typecheck_only} />
                    </div>
                    <div class="dark_input alternate_input check_box_wrapper">
                      <label class="checkbox_container"
                        >Short output
                        <input
                          type="checkbox"
                          bind:checked={$specObj.shortOutput}
                          on:change={saveOnChange}
                        />
                        <span class="checkmark" />
                      </label>
                      <CheckBoxInfo infoObj={infoObjArr.short_output} />
                    </div>
                    <div class="dark_input alternate_input check_box_wrapper">
                      <label class="checkbox_container"
                        >Multi assert
                        <input
                          type="checkbox"
                          bind:checked={$specObj.multiAssert}
                          on:change={saveOnChange}
                        />
                        <span class="checkmark" />
                      </label>
                      <CheckBoxInfo infoObj={infoObjArr.multi_assert_check} />
                    </div>
                  </div>
                </div>
              </CollapseCard>
            </div>
          </div>
        </CollapseCard>
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

  /* .alternate_input h3 {
    white-space: nowrap;
    width: max-content;
    font-size: 13px;
    margin: auto 8px auto 0;
  } */
  :global(.alternate_input div) {
    flex-grow: 1;
  }
  /* The checkbox_container */
  .checkbox_container {
    display: block;
    position: relative;
    padding-left: 30px;
    margin-bottom: 4px;
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

  .check_box_wrapper {
    position: relative;
    flex-direction: row;
    gap: 8px;
    white-space: nowrap;
  }

  .header_single {
    font-size: 12px;
    font-weight: 500;
  }

  .input_x3 {
    width: auto;
    max-width: 30%;
  }
  @media (max-width: 570px) {
    .check_between {
      flex-direction: column;
    }
  }
  @media (max-width: 470px) {
    .input_x3 {
      width: 100%;
      max-width: 100%;
    }
  }
</style>
