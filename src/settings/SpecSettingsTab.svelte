<script>
  /* ---------------------------------------------------------------------------------------------
   *  Spec settings tab. All the input components and input fields of the spec part.
   *-------------------------------------------------------------------------------------------- */

  import Select from 'svelte-select'
  import ClearIcon from './components/ClearIcon.svelte'
  import CollapseCard from './components/CollapseCard.svelte'
  import CustomInput from './components/CustomInput.svelte'
  import Icon from './components/Icon.svelte'
  import { openBrowser } from './utils/openBrowser'
  import CustomList from './components/CustomList.svelte'
  import CustomItem from './components/CustomItem.svelte'
  import {
    navState,
    specObj,
    solidityObj,
    disableForm,
    specFilesArr,
  } from './stores/store.js'
  import CheckBoxInfo from './components/CheckBoxInfo.svelte'
  import { manageFiles } from './utils/refreshFiles'

  // this items arrary contains all the solidity files and should update on when updateItems is fired
  // some fake stuff
  // ********** IMPORTANT **********
  // ********** FIRST OBJECT IN THE ARRAY MUST BE { value: 'Browse...', label: 'Browse...', path: 'src/somefolder' }
  // this brows object is needed to fire up a function to browse files (the path key is useless but might as well)

  let infoObjArr = {
    specFile: {
      infoText: 'pick spec file',
      infoLink:
        'https://docs.certora.com/en/latest/docs/prover/cli/options.html',
    },
    rules: {
      infoText:
        'Rules separated by commas. \nFormally verifies one or more given properties instead of the whole specification file. An invariant can also be selected.',
      infoLink:
        'https://docs.certora.com/en/latest/docs/prover/cli/options.html#rules',
      validator: 'spaceAndDash',
    },
    duration: {
      infoText:
        'Sets the maximal timeout (in seconds) for all the SMT solvers.',
      infoLink:
        'https://docs.certora.com/en/latest/docs/prover/cli/options.html#smt-timeout',
      validator: 'number',
    },
    optimistic_loop: {
      infoText:
        'Prover ignores any examples that would cause the loop to execute too many times.',
      infoLink:
        'https://docs.certora.com/en/latest/docs/ref-manual/approx/loops.html?highlight=optimistic#loop-unrolling',
    },
    loop_iter: {
      infoText:
        'The Certora Prover unrolls loops - if the loop should be executed three times, it will copy the code inside the loop three times. After we finish the loop’s iterations, we add an assertion to verify we have actually finished running the loop',
      infoLink:
        'https://docs.certora.com/en/latest/docs/prover/cli/options.html#loop-iter',
      validator: 'number',
    },
    flag: {
      infoText:
        'additional flags - you can find all available flags in the documentation',
      infoLink:
        'https://docs.certora.com/en/latest/docs/prover/cli/options.html',
      validator: 'alphaNum',
    },
    value: {
      infoText: '',
      infoLink: '',
      validator: 'alphaNum',
    },
    stg: {
      infoText:
        'Run on staging environment.\n\nRunning on Staging Environment requires designated Certora key.',
      infoLink:
        'https://docs.certora.com/en/latest/docs/prover/cli/options.html',
      validator: 'filePathValidator',
    },
    typecheck_only: {
      infoText:
        'Stops after running the Solidity compiler and type checking of the spec, before submitting the verification task.',
      infoLink:
        'https://docs.certora.com/en/latest/docs/prover/cli/options.html#typecheck-only',
    },
    multi_assert_check: {
      infoText:
        'This mode checks each assertion statement that occurs in a rule, separately.',
      infoLink:
        'https://docs.certora.com/en/latest/docs/prover/cli/options.html#multi-assert-check',
    },
    ruleSanity: {
      infoText: 'This option enables sanity checking for rules.',
      infoLink:
        'https://docs.certora.com/en/latest/docs/prover/cli/options.html#rule-sanity',
    },
    advancedSanity: {
      infoText:
        'If this box is checked, all the sanity checks will be performed for all invariants and rules.',
      infoLink:
        'https://docs.certora.com/en/latest/docs/prover/cli/options.html#rule-sanity',
    },
  }
  // on click on the input get al the files (sol or spec) based on what os passded to the function
  // function updateItems(fileType) {
  //   // not really expecting anything but sol here
  //   // might bove elsewhere later and make it more reusable
  //   if (fileType !== 'spec') return
  //   // this is actually pushing some fake value in (for testing only) just replace with an array of the new values from the file system like you see in the specFiles
  //   specFiles = [
  //     ...specFiles,
  //     { value: 'Browse...', label: 'Browse...', path: 'src/somefolder' },
  //   ]
  // }

  let filteredFiles,
    filter = '',
    maxFiles = 15
  let filterCountObj = {
    allFiles: $specFilesArr.length,
    filesShowing: maxFiles,
  }

  $: filter || $specFilesArr,
    (filteredFiles = manageFiles(filter, filterCountObj, $specFilesArr))

  function handleSelectSpec(event, fileType, index) {
    if (event.detail.value === 'Browse...') {
      loadFilesFolder(fileType, index)
      return
    }
    $specObj.specFile = event.detail
  }

  function handleClear(e, index) {
    $specObj.specFile = ''
  }
  // add files from folder
  function loadFilesFolder(fileType, index) {
    openBrowser(fileType, index)
  }

  // push new linking/directory
  function pushNewObj(arr, obj) {
    arr.push(obj)
    $specObj = $specObj
  }
  // remove from linking/directory
  function removeObj(arr, index) {
    arr.splice(index, 1)
    $specObj = $specObj
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

<div
  class={'card_parent_wrapper bg_dark border-rd ' +
    ($disableForm ? 'disable_main' : '')}
>
  <CollapseCard
    chevron="padding-right:16px;"
    bind:open={$navState.specCheck.active}
    resetNavProp={true}
  >
    <div slot="header" class="header header_contracts">
      <i class="codicon codicon-symbol-method" />
      <h3>Certora Spec</h3>
      <!-- <i class="codicon codicon-settings" /> -->
    </div>
    <div slot="body" class="p-16 pt-0">
      <div class="bg_light border-rd">
        <CollapseCard chevron="padding-right:12px;">
          <div slot="header" class="p-12 header header_contract">
            <i class="codicon codicon-file" />
            <h3>Main Spec File</h3>
            <h3
              style="margin-left: auto; margin-right: 0; margin-top: 2px; text-transform: none;"
            >
              {JSON.parse(JSON.stringify($specObj.specFile)).label
                ? JSON.parse(JSON.stringify($specObj.specFile)).label +
                  (JSON.parse(JSON.stringify($specObj.specFile)).type
                    ? JSON.parse(JSON.stringify($specObj.specFile)).type
                    : '')
                : ''}
            </h3>
          </div>
          <div slot="body" class="p-12 pt-0">
            <div class="input_wrapper">
              <div class="dark_input">
                <h3>Certora Specification File<span>*</span></h3>
                <Select
                  itemFilter={(label, filterText, option) => {
                    return option
                  }}
                  bind:filterText={filter}
                  listOpen={isSpecListOpen}
                  iconProps={specIconsObj}
                  items={filteredFiles}
                  Item={CustomItem}
                  {Icon}
                  {ClearIcon}
                  on:select={e => handleSelectSpec(e, 'spec')}
                  on:clear={e => handleClear(e)}
                  placeholder="Type to filter..."
                  bind:value={$specObj.specFile}
                  List={CustomList}
                />
              </div>
              <div class="dark_input">
                <h3>Rules</h3>
                <CustomInput
                  placeholder="deafult: all rules"
                  bind:bindValue={$specObj.rules}
                  infoObj={infoObjArr.rules}
                />
              </div>
            </div>
            <div class="border-rd bg_dark mt-8px">
              <CollapseCard open={false} chevron="padding-right:8px;">
                <div slot="header" class="p-8 header header_contract">
                  <i class="codicon codicon-gear" />
                  <h3>Additional Prover Settings</h3>
                </div>
                <div slot="body" class="most_inner_card">
                  <h3 class="header_single">Additional Flags</h3>

                  {#each $specObj.properties as obj, index}
                    <div class="input_wrapper mt-8px">
                      <div class="dark_input">
                        <CustomInput
                          placeholder="flag name"
                          bind:bindValue={obj.name}
                          infoObj={infoObjArr.flag}
                        />
                      </div>
                      <div class="dark_input">
                        <CustomInput
                          placeholder="value"
                          bind:bindValue={obj.value}
                          infoObj={infoObjArr.value}
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
                  <div class="input_wrapper mt-24px">
                    <div class="dark_input input_x3">
                      <h3>Duration</h3>
                      <CustomInput
                        placeholder="default: 600"
                        bind:bindValue={$specObj.duration}
                        infoObj={infoObjArr.duration}
                      />
                    </div>

                    <div
                      class="dark_input check_box_wrapper input_x3"
                      style="margin: auto 16px 8px auto;"
                    >
                      <label class="checkbox_container" style="margin: 0;">
                        Optimistic Loop
                        <input
                          type="checkbox"
                          bind:checked={$specObj.optimisticLoop}
                        />
                        <span class="checkmark" />
                      </label>
                      <CheckBoxInfo infoObj={infoObjArr.optimistic_loop} />
                    </div>
                    <div class="dark_input input_x3">
                      <h3>Loop Unroll</h3>
                      <CustomInput
                        placeholder="default: 1"
                        bind:bindValue={$specObj.loopUnroll}
                        infoObj={infoObjArr.loop_iter}
                      />
                    </div>
                  </div>
                  <div class="input_wrapper check_between ">
                    <div class="dark_input alternate_input check_box_wrapper">
                      <label class="checkbox_container"
                        >Rule Sanity
                        <input
                          type="checkbox"
                          bind:checked={$specObj.ruleSanity}
                        />
                        <span class="checkmark" />
                      </label>
                      <CheckBoxInfo infoObj={infoObjArr.ruleSanity} />
                    </div>
                    <div
                      class="dark_input alternate_input check_box_wrapper"
                      style="margin-right: 37%;"
                    >
                      <label
                        class={'checkbox_container ' +
                          (!$specObj.ruleSanity ? 'input_checkbox' : '')}
                        >Advanced Sanity
                        <input
                          type="checkbox"
                          disabled={!$specObj.ruleSanity}
                          bind:checked={$specObj.advancedSanity}
                        />
                        <span class="checkmark" />
                      </label>
                      <CheckBoxInfo infoObj={infoObjArr.advancedSanity} />
                    </div>
                  </div>
                  <div class="input_wrapper check_between ">
                    <div class="dark_input alternate_input check_box_wrapper">
                      <label class="checkbox_container"
                        >Multi Assert
                        <input
                          type="checkbox"
                          bind:checked={$specObj.multiAssert}
                        />
                        <span class="checkmark" />
                      </label>
                      <CheckBoxInfo infoObj={infoObjArr.multi_assert_check} />
                    </div>
                    <div
                      class="dark_input alternate_input  check_box_wrapper"
                      style="margin-right: 37%;"
                    >
                      <label class="checkbox_container"
                        >Local Type Checking
                        <input
                          type="checkbox"
                          bind:checked={$specObj.localTypeChecking}
                        />
                        <span class="checkmark" />
                      </label>
                      <CheckBoxInfo infoObj={infoObjArr.typecheck_only} />
                    </div>
                  </div>
                  <div class="input_wrapper check_between  mt-8px">
                    <div class="dark_input check_box_wrapper">
                      <label class="checkbox_container"
                        >Staging
                        <input
                          type="checkbox"
                          bind:checked={$specObj.runOnStg}
                        />
                        <span class="checkmark" />
                      </label>
                      <CheckBoxInfo infoObj={infoObjArr.stg} />
                    </div>
                  </div>
                  {#if $specObj.runOnStg}
                    <div class="input_wrapper input_single">
                      <div class="dark_input">
                        <h3>Branch Name</h3>
                        <CustomInput
                          placeholder="default: master"
                          bind:bindValue={$specObj.branchName}
                          infoObj={infoObjArr.stg}
                        />
                      </div>
                    </div>
                  {/if}
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

  .input_checkbox {
    cursor: not-allowed !important;
    /* color: var(--input-placeholder-foreground) !important; */
    opacity: 50%;
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
    background-color: var(--vscode-input-background);
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
  .disable_main {
    opacity: 0.4;
    pointer-events: none;
  }

  .disable_main *:hover {
    all: unset !important;
  }
</style>
