<script>
  import Select from 'svelte-select'
  import ClearIcon from './slots_and_utility/ClearIcon.svelte'
  import CollapseCard from './slots_and_utility/CollapseCard.svelte'
  import CustomInput from './slots_and_utility/CustomInput.svelte'
  import Icon from './slots_and_utility/Icon.svelte'
  import CustomItem from './slots_and_utility/CustomItem.svelte'
  import { navState, specObj, solidityObj } from './stores/store.js'

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
    $specObj.mainFile = event.detail
  }

  function handleClear(e, index) {
    $specObj.mainFile = ''
  }
  // add files from folder
  function loadFilesFolder(fileType, index) {
    // clear just incase
    handleClear(null, index)
    console.log(fileType)
    console.log(index)
  }

  $: solDisabledState = !(
    $solidityObj.mainFile !== '' &&
    $solidityObj.mainContract !== '' &&
    $solidityObj.compiler.ver !== ''
  )

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
    ifoText: 'some string',
    // LOL auto completed
    infoLink: 'www.google.com',
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
      <!-- <i class="codicon codicon-settings" /> -->
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
                <button
                  on:click={() => updateItems('spec')}
                  style="background: transparent; padding:0; border:none;"
                >
                  <Select
                    listOpen={isSpecListOpen}
                    iconProps={specIconsObj}
                    items={specFiles}
                    Item={CustomItem}
                    {Icon}
                    {ClearIcon}
                    on:select={e => handleSelectSpec(e, 'spec')}
                    on:clear={e => handleClear(e)}
                    placeholder=".spec file"
                    bind:value={$specObj.mainFile}
                  />
                </button>
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
              {#each $specObj.properties as obj, index}
                <div class="input_wrapper">
                  <div class="dark_input">
                    <CustomInput
                      placeholder="Property name"
                      bind:bindValue={obj.name}
                    />
                  </div>
                  <div class="dark_input">
                    <CustomInput
                      placeholder="Property value"
                      bind:bindValue={obj.value}
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
                })}><i class="codicon codicon-add" /> Add Property</button
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
