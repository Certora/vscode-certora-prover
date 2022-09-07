<script>
  import Select from 'svelte-select'
  import ClearIcon from './slots_and_utility/ClearIcon.svelte'
  import CollapseCard from './slots_and_utility/CollapseCard.svelte'
  import Icon from './slots_and_utility/Icon.svelte'
  import CustomItem from './slots_and_utility/CustomItem.svelte'
  import CustomInput from './slots_and_utility/CustomInput.svelte'
  import SolidityFiles from './SolidityFiles.svelte'
  import {
    solFilesArr,
    navState,
    solidityObj,
    solAdditionalContracts,
  } from './stores/store.js'

  // validator comes from validators.js
  let infoObjArr = {
    mainFile: {
      infoText: 'pick main solidity file',
      infoLink:
        'https://docs.certora.com/en/latest/docs/ref-manual/cli/options.html',
    },
    contractName: {
      infoText: 'pick main contract',
      infoLink:
        'https://docs.certora.com/en/latest/docs/ref-manual/cli/options.html',
      validator: 'alphaNum',
    },
    solCompiler: {
      infoText: 'type solidity compiler \n example: solc8.1',
      infoLink:
        'https://docs.certora.com/en/latest/docs/ref-manual/cli/options.html#solc',
      validator: 'compilerValidator',
    },
    solPackages: {
      infoText:
        'Use this option to provide a path to the Solidity compiler executable file. We check in all directories in the $PATH environment variable for an executable with this name. If --solc is not used, we look for an executable called solc, or solc.exe on windows platforms.',
      infoLink:
        'https://docs.certora.com/en/latest/docs/ref-manual/cli/options.html#solc',
      validator: 'filePathValidator',
    },
    solc_args: {
      infoText:
        'Gets a list of arguments to pass to the Solidity compiler. The arguments will be passed as is, without any formatting, in the same order.',
      infoLink:
        'https://docs.certora.com/en/latest/docs/ref-manual/cli/options.html#solc-args',
      validator: 'alphaNum',
    },
    package: {
      infoText:
        'For each package, gets the path to a directory including that Solidity package.',
      infoLink:
        'https://docs.certora.com/en/latest/docs/ref-manual/cli/options.html#packages',
      validator: 'filePathValidator',
    },
    link: {
      infoText: 'Links a slot in a contract with another contract.',
      infoLink:
        'https://docs.certora.com/en/latest/docs/ref-manual/cli/options.html#link',
      validator: 'alphaNum',
    },
    method: {
      infoText:
        'Parametric rules will only verify the method with the given signature, instead of all public and external methods of the contract. Note that you will need to wrap the method’s signature with quotes, as the shell doesn’t interpret parenthesis correctly otherwise.',
      infoLink:
        'https://docs.certora.com/en/latest/docs/ref-manual/cli/options.html#method',
      validator: 'alphaNum',
    },
  }
  // handle browse files
  function handleSelectSol(event) {
    if (event.detail.value === 'Browse...') {
      loadFilesFolder('sol', 0)
      return
    }
    $solidityObj.mainFile = event.detail
  }
  // clears the store.js solidityObj.mainFile/ solAdditionalContracts
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
  }
  // add new empty solidity file push new obj to array
  function addNewFile() {
    $solAdditionalContracts = [
      ...$solAdditionalContracts,
      {
        mainFile: '',
        mainContract: '',
        linking: [{ variable: '', contractName: '' }],
        compiler: { exe: '', ver: '' },
      },
    ]
  }
  // main solidity card open/close
  let isSolidityListOpen = false
  // icon props expect an object
  let solidityIconsObj = {
    // bind to some variable later to check if the input is selected
    // logic for later only show info icon when selected
    // passing just the function and the info icon text for now
    selected: isSolidityListOpen,
    loadFilesFolder: loadFilesFolder,
    fileType: 'sol',
    ifoText: infoObjArr.mainFile.infoText,
    infoLink: infoObjArr.mainFile.infoLink,
  }
  // maxFiles to display in input (limit the amount of files we display in the input drop),
  // filtered files new array made from $solFilesArr
  // filterCountObj keep count/track <5/1000 file showing>
  let filteredFiles,
    filter = '',
    maxFiles = 15
  let filterCountObj = {
    allFiles: $solFilesArr.length,
    filesShowing: maxFiles,
  }
  // subscribe to solidity files array and input filter
  $: filter || $solFilesArr, manageFiles(filter)
  // all the file action happens here
  function manageFiles(filter) {
    // on app load filter changes to '' and reset is called
    // and when it actually is an ''
    if (filter === '') {
      resetFiles()
      return
    }
    // filter all the files
    let newFilteredFiles = $solFilesArr.filter(file => {
      return file.label.includes(filter)
    })
    // if no matches found return an empty array to display a message
    if (!newFilteredFiles.length) return (filteredFiles = [])
    // if the amount of the filtered files is bigger than display limit slice and dice the array
    if (newFilteredFiles.length > filterCountObj.filesShowing) {
      filteredFiles = [
        {
          value: 'Browse...',
          label: 'Browse...',
          path: `Showing ${filterCountObj.filesShowing}/${newFilteredFiles.length} files`,
        },
        ...newFilteredFiles.slice(0, filterCountObj.filesShowing),
      ]
      return
    }
    // amount of the filtered files is smaller or same as limit
    filteredFiles = [
      {
        value: 'Browse...',
        label: 'Browse...',
        path: `Showing ${newFilteredFiles.length}/${newFilteredFiles.length} files`,
      },
      ...newFilteredFiles,
    ]
    return
  }

  // resets the input files array and the count object
  function resetFiles() {
    filterCountObj = {
      allFiles: $solFilesArr.length,
      filesShowing: maxFiles,
    }
    filteredFiles = [
      {
        value: 'Browse...',
        label: 'Browse...',
        path: `Showing ${
          $solFilesArr.slice(0, filterCountObj.filesShowing).length
        }/${filterCountObj.allFiles} files`,
      },
      ...$solFilesArr.slice(0, filterCountObj.filesShowing),
    ]
  }

  // updateItems needs redesign
  function updateItems() {
    // do nothing
  }
</script>

<div class="card_parent_wrapper bg_dark border-rd">
  <CollapseCard
    chevron="padding-right:16px;"
    bind:open={$navState.solCheck.active}
    resetNavProp={true}
  >
    <div slot="header" class="header header_contracts">
      <i class="codicon codicon-file" />
      <h3>Solidity contracts</h3>
    </div>
    <div slot="body" class="p-16 pt-0">
      <div class="bg_light border-rd">
        <CollapseCard chevron="padding-right:12px;">
          <div slot="header" class="p-12 header header_contract">
            <i class="codicon codicon-file" />
            <h3>Main contract</h3>
          </div>
          <div slot="body" class="p-12 pt-0">
            <div class="input_wrapper">
              <div class="dark_input">
                <h3>Source<span>*</span></h3>
                <Select
                  itemFilter={(label, filterText, option) => {
                    return option
                  }}
                  bind:filterText={filter}
                  items={filteredFiles}
                  listOpen={isSolidityListOpen}
                  iconProps={solidityIconsObj}
                  Item={CustomItem}
                  {Icon}
                  {ClearIcon}
                  on:select={handleSelectSol}
                  on:clear={e => handleClear(e)}
                  placeholder="Type to filter..."
                  bind:value={$solidityObj.mainFile}
                />
              </div>
              <div class="dark_input">
                <h3>Main contract name<span>*</span></h3>
                <CustomInput
                  infoObj={infoObjArr.contractName}
                  placeholder="className()"
                  bind:bindValue={$solidityObj.mainContract}
                />
              </div>
            </div>
            <div class="border-rd bg_dark mt-8px">
              <CollapseCard chevron="padding-right:8px;">
                <div slot="header" class="p-8 header header_contract">
                  <i class="codicon codicon-gear" />
                  <h3>Compiler</h3>
                  <h3 style="margin-left:auto; text-transform:initial;">
                    {$solidityObj.compiler.ver}
                  </h3>
                </div>
                <div slot="body" class="most_inner_card">
                  <div class="input_wrapper">
                    <div class="dark_input">
                      <h3>Soldity compiler to use<span>*</span></h3>
                      <!-- no placeholder, this filed should have the default compiler selected by default -->
                      <CustomInput
                        infoObj={infoObjArr.solCompiler}
                        placeholder="version: solc7.6"
                        bind:bindValue={$solidityObj.compiler.ver}
                      />
                    </div>
                    <div class="dark_input">
                      <h3>Directory containing compilers (Optional)</h3>
                      <CustomInput
                        infoObj={infoObjArr.solPackages}
                        placeholder="CVT-Executables-Mac"
                        bind:bindValue={$solidityObj.compiler.exe}
                      />
                    </div>
                  </div>
                  <!-- advanced settings -->
                  <div class="border-rd bg_light mt-8px">
                    <CollapseCard open={false} chevron="padding-right:8px;">
                      <div slot="header" class="p-8 header header_contract">
                        <i class="codicon codicon-gear" />
                        <h3>Advanced Settings</h3>
                      </div>
                      <div slot="body" class="most_inner_card border_light">
                        <div class="dark_input">
                          <h3
                            style="font-size: 12px;
                          line-height: 14px;
                          font-weight: 500;"
                          >
                            Solidity Arguments
                          </h3>
                          {#each $solidityObj.solidityArgs as obj, index}
                            <div class="input_wrapper mt-8px">
                              <div class="dark_input">
                                <CustomInput
                                  infoObj={infoObjArr.solc_args}
                                  placeholder="key"
                                  bind:bindValue={obj.key}
                                />
                              </div>
                              <div class="dark_input">
                                <CustomInput
                                  infoObj={infoObjArr.solc_args}
                                  placeholder="value"
                                  bind:bindValue={obj.value}
                                />
                              </div>
                              <i
                                class="codicon codicon-trash"
                                on:click={removeObj(
                                  $solidityObj.solidityArgs,
                                  index,
                                )}
                              />
                            </div>
                          {/each}
                        </div>
                        <button
                          class="btn_add"
                          on:click={pushNewObj($solidityObj.solidityArgs, {
                            key: '',
                            value: '',
                          })}
                          ><i class="codicon codicon-add" /> Add Directory</button
                        >
                        <div
                          class="dark_input border_light mt-8px"
                          style="border-top: 1px solid var(--vscode-foreground); padding-top:8px;"
                        >
                          <h3
                            style="font-size: 12px;
                          line-height: 14px;
                          font-weight: 500;"
                          >
                            Solidity package directories
                          </h3>
                          {#each $solidityObj.solidityPackageDir as obj, index}
                            <div class="input_wrapper mt-8px">
                              <div class="dark_input">
                                <CustomInput
                                  infoObj={infoObjArr.package}
                                  placeholder="Package name"
                                  bind:bindValue={obj.packageName}
                                />
                              </div>
                              <div class="dark_input">
                                <CustomInput
                                  infoObj={infoObjArr.package}
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
                        </div>

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
            <div class="border-rd bg_dark mt-8px">
              <CollapseCard open={false} chevron="padding-right:8px;">
                <div slot="header" class="p-8 header header_contract">
                  <i class="codicon codicon-gear" />
                  <h3>Linking</h3>
                </div>
                <div slot="body" class="most_inner_card">
                  {#each $solidityObj.linking as obj, index}
                    <div class="input_wrapper mt-8px">
                      <div class="dark_input">
                        <CustomInput
                          infoObj={infoObjArr.link}
                          placeholder="Variable"
                          bind:bindValue={obj.variable}
                        />
                      </div>
                      <div class="dark_input">
                        <CustomInput
                          infoObj={infoObjArr.link}
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
            <div class="border-rd bg_dark mt-8px">
              <CollapseCard open={false} chevron="padding-right:8px;">
                <div slot="header" class="p-8 header header_contract">
                  <i class="codicon codicon-gear" />
                  <h3>Specific method</h3>
                </div>
                <div slot="body" class="most_inner_card">
                  <div class="input_wrapper input_single">
                    <div class="dark_input">
                      <h3>Function name</h3>
                      <CustomInput
                        infoObj={infoObjArr.method}
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
        <!-- needs new changes -->
        <SolidityFiles
          {index}
          solFiles={$solFilesArr}
          {updateItems}
          {handleClear}
          {loadFilesFolder}
          {infoObjArr}
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
