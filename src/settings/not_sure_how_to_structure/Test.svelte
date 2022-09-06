<script>
  import Select from 'svelte-select'
  import ClearIcon from './slots_and_utility/ClearIcon.svelte'
  import CollapseCard from './slots_and_utility/CollapseCard.svelte'
  import Icon from './slots_and_utility/Icon.svelte'
  import CustomItem from './slots_and_utility/CustomItem.svelte'
  import CustomInput from './slots_and_utility/CustomInput.svelte'
  import SolidityFiles from './SolidityFiles.svelte'
  import {
    filterSol,
    navState,
    solidityObj,
    solAdditionalContracts,
  } from './stores/store.js'

  // emailValidator ,spaceAndDashValidator, numberValidator, compilerValidator, filePathVlidator
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
  // this items arrary contains all the solidity files and should update on when updateItems is fired
  // some fake stuff
  // ********** IMPORTANT **********
  // ********** FIRST OBJECT IN THE ARRAY MUST BE { value: 'Browse...', label: 'Browse...', path: 'src/somefolder' }
  // this brows object is needed to fire up a function to browse files (the path key is useless but might as well)
  let solFiles = [
    { value: 'src/somefolder/file-1', label: 'file-1', path: 'src/somefolder' },
    { value: 'src/somefolder/file-1', label: 'file-1', path: 'src/somefolder' },
    { value: 'src/somefolder/file-1', label: 'file-1', path: 'src/somefolder' },
    {
      value: 'src/somefolder/file-11',
      label: 'file-11',
      path: 'src/somefolder',
    },
    {
      value: 'src/somefolder/file-11',
      label: 'file-11',
      path: 'src/somefolder',
    },
    { value: 'src/somefolder/file-1', label: 'file-1', path: 'src/somefolder' },
    {
      value: 'src/somefolder/file-11',
      label: 'file-11',
      path: 'src/somefolder',
    },
    {
      value: 'src/somefolder/file-111',
      label: 'file-111',
      path: 'src/somefolder',
    },
    { value: 'src/somefolder/file-1', label: 'file-1', path: 'src/somefolder' },
    {
      value: 'src/somefolder/file-1111',
      label: 'file-1111',
      path: 'src/somefolder',
    },
    {
      value: 'src/somefolder/file-1111',
      label: 'file-1111',
      path: 'src/somefolder',
    },
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

  // let filterCountObj = {
  // allFiles:solFiles.length,
  // filesShowing:15
  // }
  // let filteredFiles =[{ value: 'Browse...', label: 'Browse...', path: `Showing ${solFiles.slice(0, filterCountObj.filesShowing).length}/${filterCountObj.allFiles} files` }, ...solFiles.slice(0, filterCountObj.filesShowing)]

  // because the input is initialized with an empty string, resetFiles() fires right away so these 2 variables can be declared with no value
  let filteredFiles, filterCountObj

  // on click on the input get al the files (sol or spec) based on what os passded to the function
  function updateItems(fileType) {
    // not really expecting anything but sol here
    // might bove elsewhere later and make it more reusable
    if (fileType !== 'sol') return
    // this is actually pushing some fake value in (for testing only) just replace with an array of the new values from the file system like you see in the specFiles
    // solFiles = [
    //   ...solFiles,
    //   { value: 'Browse...', label: 'Browse...', path: 'src/somefolder' },
    // ]
  }

  function handleSelectSol(event) {
    if (event.detail.value === 'Browse...') {
      loadFilesFolder('sol', 0)
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

  let filter = ''
  $: if (filter === '') resetFiles()

  function manageFiles(filter) {
    // some times fires on empty string/delete and some times not
    // if(filter === '') console.log('some times i work')
    let newFilteredFiles = solFiles.filter(file => {
      return file.label.includes(filter)
    })

    if (newFilteredFiles.length > filterCountObj.filesShowing) {
      filteredFiles = [
        {
          value: 'Browse...',
          label: 'Browse...',
          path: `Showing ${filterCountObj.filesShowing}/${newFilteredFiles.length} files`,
        },
        ...newFilteredFiles.slice(0, filterCountObj.filesShowing),
      ]
      return filteredFiles
    }

    filteredFiles = [
      {
        value: 'Browse...',
        label: 'Browse...',
        path: `Showing ${newFilteredFiles.length}/${newFilteredFiles.length} files`,
      },
      ...newFilteredFiles,
    ]
    // filteredFiles = [{ selectable: false ,label: `Showing ${filterCountObj.filesShowing}/${filterCountObj.allFiles} files`, path:''},{ value: 'Browse...', label: 'Browse...', path: 'src/somefolder' }, ...newFilteredFiles]
    return filteredFiles

    //  0/0 logic / message
  }

  function promiseTest(filterText) {
    return Promise.resolve(manageFiles(filterText))
  }
  // promiseTest('')

  function resetFiles() {
    filterCountObj = {
      allFiles: solFiles.length,
      filesShowing: 50,
    }
    filteredFiles = [
      {
        value: 'Browse...',
        label: 'Browse...',
        path: `Showing ${
          solFiles.slice(0, filterCountObj.filesShowing).length
        }/${filterCountObj.allFiles} files`,
      },
      ...solFiles.slice(0, filterCountObj.filesShowing),
    ]
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
                <button
                  on:click={() => updateItems('sol')}
                  style="background: transparent; padding:0; border:none;"
                >
                  <!-- itemFilter: (label, filterText, option) => label === 'Ice Cream' -->
                  <!--  itemFilter = {(label, filterText, option)=> {return option}} -->
                  <!-- questionable -->
                  <!-- itemFilter = {(label, filterText, option)=> {return option}} -->
                  <Select
                    bind:filterText={filter}
                    items={filteredFiles}
                    loadOptions={promiseTest}
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
                </button>
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
        <SolidityFiles
          {index}
          {solFiles}
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
