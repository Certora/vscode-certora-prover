<script>
  /* ---------------------------------------------------------------------------------------------
   *  Solidity settings tab. All the input components and input fields of the solidity main contract part.
   *-------------------------------------------------------------------------------------------- */

  import Select from 'svelte-select'
  import ClearIcon from './components/ClearIcon.svelte'
  import CollapseCard from './components/CollapseCard.svelte'
  import Icon from './components/Icon.svelte'
  import CustomItem from './components/CustomItem.svelte'
  import CustomInput from './components/CustomInput.svelte'
  import SolidityFiles from './SolidityFiles.svelte'
  import { openBrowser } from './utils/openBrowser'
  import { manageFiles } from './utils/refreshFiles'
  import {
    solFilesArr,
    navState,
    solidityObj,
    solAdditionalContracts,
  } from './stores/store.js'
  import CustomList from './components/CustomList.svelte'

  // validator comes from validators.js
  let infoObjArr = {
    mainFile: {
      infoText: 'pick main solidity file',
      infoLink:
        'https://docs.certora.com/en/latest/docs/ref-manual/cli/options.html',
    },
    contractName: {
      infoText: 'type main contract name',
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
      infoText: 'Gets an argument to pass to the Solidity compiler.',
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
    linkVar: {
      infoText: `Links a slot in a contract with another contract.<p style='font-family:monospace'> --link CurrentContract : <ins><b>Variable</b></ins> = OtherContract</p>`,
      infoLink:
        'https://docs.certora.com/en/latest/docs/ref-manual/cli/options.html#link',
      validator: 'alphaNum',
    },
    linkContract: {
      infoText: `Links a slot in a contract with another contract.<p style='font-family:monospace'> --link CurrentContract : Variable = <ins><b>OtherContract</b></ins></p>`,
      infoLink:
        'https://docs.certora.com/en/latest/docs/ref-manual/cli/options.html#link',
      validator: 'alphaNum',
    },
  }

  // handle browse files

  function handleSelectSol(event) {
    if (event.detail.value === 'Browse...') {
      loadFilesFolder('sol')
      return
    }
    $solidityObj.mainFile = event.detail
    if ($solidityObj.mainFile) {
      $solidityObj.mainContract = $solidityObj.mainFile.label
        .toString()
        .split('/')
        .reverse()[0]
        .replace('.sol', '')
    }
  }
  // clears the store.js solidityObj.mainFile/ solAdditionalContracts
  function handleClear(e, index = -1) {
    // e is passes on by default here
    if (index > -1) {
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
    openBrowser(fileType, index)
  }
  // add new empty solidity file push new obj to array
  function addNewFile() {
    $solAdditionalContracts = [
      ...$solAdditionalContracts,
      {
        mainFile: '',
        mainContract: '',
        linking: [{ variable: '', contractName: '' }],
        compiler: $solidityObj.compiler,
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
  $: filter || $solFilesArr,
    (filteredFiles = manageFiles(filter, filterCountObj, $solFilesArr))

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
      <i
        ><svg
          xmlns="http://www.w3.org/2000/svg"
          width="16"
          height="16"
          viewBox="0 0 16 16"
          fill="inherit"
        >
          <path
            d="M6.208 8.4L8 9.456H8.048C9.25333 8.72 10.1707 8.18667 10.8 7.856V7.808C10.576 7.40267 10.3093 6.96533 10 6.496L8.048 3.248L7.648 3.904C7.37067 4.36267 7.17333 4.70933 7.056 4.944C6.97067 5.09333 6.832 5.32267 6.64 5.632C6.45867 5.93067 6.33067 6.15467 6.256 6.304C5.85067 6.96533 5.54667 7.44533 5.344 7.744V7.808C5.44 7.91467 5.632 8.05333 5.92 8.224L6.208 8.4ZM8.352 10.304C8.32 10.3147 8.26133 10.3467 8.176 10.4L8 10.496C7.872 10.4107 7.67467 10.2933 7.408 10.144C7.14133 9.99467 6.93333 9.88267 6.784 9.808C6.64533 9.72267 6.42667 9.58933 6.128 9.408C5.82933 9.216 5.60533 9.07733 5.456 8.992C5.43467 8.98133 5.39733 8.96533 5.344 8.944L5.248 8.896L5.648 9.456C6.11733 10.1173 6.48533 10.6133 6.752 10.944C6.88 11.1467 7.08267 11.44 7.36 11.824C7.648 12.208 7.86133 12.5013 8 12.704V12.72C8.01067 12.7413 8.02667 12.752 8.048 12.752L9.904 10.144C10 10.016 10.1493 9.81333 10.352 9.536C10.5547 9.248 10.704 9.03467 10.8 8.896C9.88267 9.38667 9.06667 9.856 8.352 10.304Z"
            fill="inherit"
          />
        </svg></i
      >
      <h3>Solidity contracts</h3>
    </div>
    <div slot="body" class="p-16 pt-0">
      <div class="bg_light border-rd">
        <CollapseCard chevron="padding-right:12px;">
          <div slot="header" class="p-12 header header_contract">
            <i class="codicon codicon-file" />
            <h3>Main contract</h3>
            <h3 style="margin-left: auto; margin-right: 0; margin-top: 2px">
              {$solidityObj.mainContract}
            </h3>
          </div>
          <div slot="body" class="p-12 pt-0">
            <div class="input_wrapper">
              <div class="dark_input">
                <h3>Main Solidity File<span>*</span></h3>
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
                  List={CustomList}
                />
              </div>
              <div class="dark_input">
                <h3>Main Contract Name<span>*</span></h3>
                <CustomInput
                  infoObj={infoObjArr.contractName}
                  placeholder="Contract"
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
                      <h3>Solidity compiler to use<span>*</span></h3>
                      <!-- no placeholder, this filed should have the default compiler selected by default -->
                      <CustomInput
                        infoObj={infoObjArr.solCompiler}
                        placeholder="example: solc7.6"
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
                            Solidity Compiler Arguments
                          </h3>
                          {#each $solidityObj.solidityArgs as obj, index}
                            <div class="input_wrapper mt-8px">
                              <div class="dark_input">
                                <CustomInput
                                  infoObj={infoObjArr.solc_args}
                                  placeholder="example: optimize-runs"
                                  bind:bindValue={obj.key}
                                />
                              </div>
                              <div class="dark_input">
                                <CustomInput
                                  infoObj={infoObjArr.solc_args}
                                  placeholder="value (optional)"
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
                          ><i class="codicon codicon-add" /> Add Argument</button
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
                            Solidity Package Directories
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
                          infoObj={infoObjArr.linkVar}
                          placeholder="Variable"
                          bind:bindValue={$solidityObj.linking[index].variable}
                        />
                      </div>
                      <div class="dark_input">
                        <CustomInput
                          infoObj={infoObjArr.linkContract}
                          placeholder="Other Contract"
                          bind:bindValue={$solidityObj.linking[index]
                            .contractName}
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
