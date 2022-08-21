<script>
  import Select from 'svelte-select'
  import ClearIcon from './slots_and_utility/ClearIcon.svelte'
  import CollapseCard from './slots_and_utility/CollapseCard.svelte'
  import Icon from './slots_and_utility/Icon.svelte'
  import CustomItem from './slots_and_utility/CustomItem.svelte'
  import CustomInput from './slots_and_utility/CustomInput.svelte'

  import {
    navState,
    solidityObj,
    solAdditionalContracts,
  } from './stores/store.js'
  import SolidityFiles from './SolidityFiles.svelte'

  // this items arrary contains all the solidity files and should update on when updateItems is fired
  // some fake stuff
  // ********** IMPORTANT **********
  // ********** FIRST OBJECT IN THE ARRAY MUST BE { value: 'Browse...', label: 'Browse...', path: 'src/somefolder' }
  // this brows object is needed to fire up a function to browse files (the path key is useless but might as well)
  $: solFiles = [
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
    if (fileType !== 'sol') return
    // this is actually pushing some fake value in (for testing only) just replace with an array of the new values from the file system like you see in the specFiles
    solFiles = [
      ...solFiles,
      { value: 'Browse...', label: 'Browse...', path: 'src/somefolder' },
    ]
  }

  function handleSelectSol(event, fileType, index) {
    console.log(event)
    if (event.detail.value === 'Browse...') {
      loadFilesFolder(fileType, index)
      return
    }
    if (index) {
      $solAdditionalContracts[index].mainFile = event.detail
      return
    }
    $solidityObj.mainFile = event.detail
  }

  function handleClear(e, index) {
    // e is passes on by default here
    if (index) {
      $solAdditionalContracts[index].mainFile = ''
      return
    }
    $solidityObj.mainFile = ''
  }

  // push new linking/directory
  function pushNewObj(arr, obj) {
    arr.push(obj)
    $solidityObj = $solidityObj
  }
  // remove from linking/directory
  function removeObj(arr, index) {
    arr.splice(index, 1)
    $solidityObj = $solidityObj
  }

  // add files from folder
  function loadFilesFolder(fileType, index) {
    // clear just incase
    handleClear(null, index)
    console.log(fileType)
    console.log(index)
  }

  // add new empty solidity file push new obj to array
  function addNewFile() {
    $solAdditionalContracts = [
      ...$solAdditionalContracts,
      {
        mainFile: '',
        mainContract: '',
        linking: [{ variable: '', contractName: '' }],
        specifiMethod: '',
        compiler: { exe: '', ver: '' },
      },
    ]
  }

  let isSolidityListOpen = false
  // icon props expect an object
  let solidityIconsObj = {
    // bind to some variable later to check if the input is selected
    // logic for later only show info icon when selected
    // passing just the function and the info icon text for now
    selected: isSolidityListOpen,
    loadFilesFolder: loadFilesFolder,
    fileType: 'sol',
    ifoText: 'some string',
    // LOL auto completed
    infoLink: 'www.google.com',
  }

  // functions to pass down to solfiles and make them take pareameters
  // loadFilesFolder(), isSolidityListOpen() - let isSolidityListOpen = false,
  // objects
</script>

<button
  on:click={() => {
    console.log($solidityObj.mainFile)
    console.log($solAdditionalContracts)
  }}>test btn (i log main file)</button
>
<div class="card_parent_wrapper bg_dark">
  <CollapseCard bind:open={$navState.solCheck.active} resetNavProp={true}>
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
                <button
                  on:click={() => updateItems('sol')}
                  style="background: transparent; padding:0; border:none;"
                >
                  <Select
                    listOpen={isSolidityListOpen}
                    iconProps={solidityIconsObj}
                    items={solFiles}
                    Item={CustomItem}
                    {Icon}
                    {ClearIcon}
                    on:select={e => handleSelectSol(e, 'sol')}
                    on:clear={e => handleClear(e)}
                    placeholder="Main solidity file"
                    bind:value={$solidityObj.mainFile}
                  />
                </button>
              </div>
              <div class="dark_input">
                <h3>Main contract name<span>*</span></h3>
                <CustomInput
                  placeholder="className()"
                  bind:bindValue={$solidityObj.mainContract}
                />
              </div>
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
                      <CustomInput
                        placeholder="CVT-Executables-Mac"
                        bind:bindValue={$solidityObj.compiler.exe}
                      />
                    </div>
                    <div class="dark_input">
                      <h3>Default soldity version to use<span>*</span></h3>
                      <!-- no placeholder, this filed should have the default compiler selected by default -->
                      <CustomInput
                        placeholder="version: solc7.6"
                        bind:bindValue={$solidityObj.compiler.ver}
                      />
                    </div>
                  </div>

                  <!-- validation message -->
                  <!-- <div class="input_error_message">
                    <i class="codicon codicon-warning" />
                    Validation message
                    <a target="_blank">Optional link to docs</a>
                  </div> -->

                  <!-- advanced settings -->
                  <div class="card_body_wrapper_parent bg_light mt-8px">
                    <CollapseCard open={false}>
                      <div slot="header" class="header header_contract">
                        <i class="codicon codicon-gear" />
                        <h3>Advanced Settings</h3>
                        <i class="codicon codicon-chevron-up" />
                      </div>
                      <div slot="body" class="card_body_wrapper">
                        <div class="input_wrapper input_single">
                          <div class="dark_input">
                            <h3>Solidity Argument</h3>
                            <CustomInput
                              placeholder="Argument"
                              bind:bindValue={$solidityObj.solidityArgument}
                            />
                          </div>
                        </div>
                        {#each $solidityObj.solidityPackageDir as obj, index}
                          <div class="input_wrapper">
                            <div class="dark_input">
                              <h3>Solidity package directories</h3>
                              <CustomInput
                                placeholder="Package name"
                                bind:bindValue={obj.packageName}
                              />
                            </div>
                            <div class="dark_input">
                              <h3>&nbsp;</h3>
                              <CustomInput
                                placeholder=".../path"
                                bind:bindValue={obj.path}
                              />
                            </div>
                            <i
                              class="codicon codicon-trash"
                              on:click={removeObj(
                                $solidityObj.solidityPackageDir,
                                index,
                              )}
                            />
                          </div>
                        {/each}

                        <button
                          class="btn_add"
                          on:click={pushNewObj(
                            $solidityObj.solidityPackageDir,
                            { packageName: '', path: '' },
                          )}
                          ><i class="codicon codicon-add" /> Add Directory</button
                        >
                      </div>
                    </CollapseCard>
                  </div>
                </div>
              </CollapseCard>
            </div>
            <!-- linking -->
            <div class="card_body_wrapper_parent bg_dark mt-8px">
              <CollapseCard open={false}>
                <div slot="header" class="header header_contract">
                  <i class="codicon codicon-gear" />
                  <h3>Linking</h3>
                  <i class="codicon codicon-chevron-up" />
                </div>
                <div slot="body" class="card_body_wrapper">
                  {#each $solidityObj.linking as obj, index}
                    <div class="input_wrapper">
                      <div class="dark_input">
                        <CustomInput
                          placeholder="Variable"
                          bind:bindValue={obj.variable}
                        />
                      </div>
                      <div class="dark_input">
                        <CustomInput
                          placeholder="Contract name"
                          bind:bindValue={obj.contractName}
                        />
                      </div>
                      <i
                        class="codicon codicon-trash"
                        on:click={removeObj($solidityObj.linking, index)}
                      />
                    </div>
                  {/each}
                  <button
                    class="btn_add"
                    on:click={pushNewObj($solidityObj.linking, {
                      variable: '',
                      contractName: '',
                    })}><i class="codicon codicon-add" /> Add Link</button
                  >
                </div>
              </CollapseCard>
            </div>
            <div class="card_body_wrapper_parent bg_dark mt-8px">
              <CollapseCard open={false}>
                <div slot="header" class="header header_contract">
                  <i class="codicon codicon-gear" />
                  <h3>Specific method</h3>
                  <i class="codicon codicon-chevron-up" />
                </div>
                <div slot="body" class="card_body_wrapper">
                  <div class="input_wrapper input_single">
                    <div class="dark_input">
                      <h3>Function name</h3>
                      <CustomInput
                        placeholder="method_name()"
                        bind:bindValue={$solidityObj.specifiMethod}
                      />
                    </div>
                  </div>
                </div>
              </CollapseCard>
            </div>
          </div>
        </CollapseCard>
      </div>
      {#each $solAdditionalContracts as file, index}
        <SolidityFiles
          {index}
          {solFiles}
          {updateItems}
          {handleClear}
          {handleSelectSol}
          {loadFilesFolder}
        />
      {/each}
      <button class="btn_add" on:click={addNewFile}
        ><i class="codicon codicon-add" /> Add another contract</button
      >
    </div>
  </CollapseCard>
</div>

<style>
  :global(.listContainer) {
    width: max-content !important;
  }
</style>
