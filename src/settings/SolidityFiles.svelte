<script>
  import Select from 'svelte-select'
  import ClearIcon from './components/ClearIcon.svelte'
  import CollapseCard from './components/CollapseCard.svelte'
  import Icon from './components/Icon.svelte'
  import CustomItem from './components/CustomItem.svelte'
  import CustomInput from './components/CustomInput.svelte'
  import { solAdditionalContracts, solFilesArr } from './stores/store.js'
  import { manageFiles } from './utils/refreshFiles'

  //   slots
  export let index
  export let handleClear
  export let loadFilesFolder
  export let infoObjArr

  let isSolidityListOpen = false
  let solidityIconsObj = {
    selected: isSolidityListOpen,
    loadFilesFolder: loadFilesFolder,
    fileType: 'sol',
    index: index,
    ifoText: infoObjArr.mainFile.infoText,
    infoLink: infoObjArr.mainFile.infoText,
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
  // push new linking/directory
  function pushNewObj(arr, obj) {
    arr.push(obj)
    $solAdditionalContracts[index] = $solAdditionalContracts[index]
  }
  // remove from linking/directory
  function removeObj(arr, i) {
    arr.splice(i, 1)
    $solAdditionalContracts[index] = $solAdditionalContracts[index]
  }

  // remove solidity file by index
  function removeSolFile(index) {
    $solAdditionalContracts.splice(index, 1)
    $solAdditionalContracts = $solAdditionalContracts
  }

  function handleSelectSol(event, index) {
    if (event.detail.value === 'Browse...') {
      loadFilesFolder('sol', index)
      return
    }
    $solAdditionalContracts[index].mainFile = event.detail
    if ($solAdditionalContracts[index].mainFile) {
      $solAdditionalContracts[index].mainContract = $solAdditionalContracts[
        index
      ].mainFile.label
        .toString()
        .split('/')
        .reverse()[0]
        .replace('.sol', '')
    }
  }
</script>

<div class="bg_light border-rd mt-8px">
  <CollapseCard chevron="padding-right:12px;">
    <div
      slot="header"
      class="header header_contract"
      style="padding: 10px 4px 10px 12px"
    >
      <i class="codicon codicon-file" />
      <h3 style="line-height: 18px; margin-right:auto;">
        Additional Contract {$solAdditionalContracts[index].mainContract
          ? `${$solAdditionalContracts[index].mainContract}`
          : `${index + 1}`}
      </h3>
      <i
        class="codicon codicon-trash"
        on:click|stopPropagation={() => removeSolFile(index)}
      />
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
            listOpen={isSolidityListOpen}
            iconProps={solidityIconsObj}
            items={filteredFiles}
            Item={CustomItem}
            {Icon}
            {ClearIcon}
            on:select={e => handleSelectSol(e, index)}
            on:clear={e => handleClear(e, index)}
            placeholder="Type to filter..."
            bind:value={$solAdditionalContracts[index].mainFile}
          />
        </div>
        <div class="dark_input">
          <h3>Main contract name</h3>
          <CustomInput
            infoObj={infoObjArr.contractName}
            placeholder="Contract"
            bind:bindValue={$solAdditionalContracts[index].mainContract}
          />
        </div>
      </div>
      <div class="border-rd bg_dark mt-8px">
        <CollapseCard chevron="padding-right:8px;">
          <div slot="header" class="p-8 header header_contract">
            <i class="codicon codicon-gear" />
            <h3>Compiler</h3>
            <h3 style="margin-left:auto; text-transform:initial;">
              {$solAdditionalContracts[index].compiler.ver}
            </h3>
          </div>
          <div slot="body" class="most_inner_card">
            <div class="input_wrapper">
              <div class="dark_input">
                <h3>Soldity compiler to use</h3>

                <!-- no placeholder, this filed should have the default compiler selected by default -->
                <CustomInput
                  infoObj={infoObjArr.solCompiler}
                  placeholder="exaple: solc7.6"
                  bind:bindValue={$solAdditionalContracts[index].compiler.ver}
                />
              </div>
              <div class="dark_input">
                <h3>Directory containing compiler (Optional)</h3>
                <CustomInput
                  infoObj={infoObjArr.solPackages}
                  placeholder="CVT-Executables-Mac"
                  bind:bindValue={$solAdditionalContracts[index].compiler.exe}
                />
              </div>
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
            {#each $solAdditionalContracts[index].linking as obj, index}
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
                  on:click={removeObj(
                    $solAdditionalContracts[index].linking,
                    index,
                  )}
                />
              </div>
            {/each}
            <button
              class="btn_add"
              on:click={pushNewObj($solAdditionalContracts[index].linking, {
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
