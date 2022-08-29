<script>
  import Select from 'svelte-select'
  import ClearIcon from './slots_and_utility/ClearIcon.svelte'
  import CollapseCard from './slots_and_utility/CollapseCard.svelte'
  import Icon from './slots_and_utility/Icon.svelte'
  import CustomItem from './slots_and_utility/CustomItem.svelte'
  import CustomInput from './slots_and_utility/CustomInput.svelte'
  import { solAdditionalContracts, solFilesArr } from './stores/store.js'
  import { refreshFiles } from '../utils/refreshFiles'

  //   slots
  export let index
  export let handleClear
  export let loadFilesFolder
  export let infoObjArr
  export let saveOnChange

  let isSolidityListOpen = false
  let solidityIconsObj = {
    selected: isSolidityListOpen,
    loadFilesFolder: loadFilesFolder,
    fileType: 'sol',
    index: index,
    ifoText: infoObjArr.mainFile.infoText,
    infoLink: infoObjArr.mainFile.infoText,
  }

  // push new linking/directory
  function pushNewObj(arr, obj) {
    arr.push(obj)
    $solAdditionalContracts[index] = $solAdditionalContracts[index]
    // saveOnChange()
  }
  // remove from linking/directory
  function removeObj(arr, i) {
    arr.splice(i, 1)
    $solAdditionalContracts[index] = $solAdditionalContracts[index]
    saveOnChange()
  }

  // remove solidity file by index
  function removeSolFile(index) {
    $solAdditionalContracts.splice(index, 1)
    $solAdditionalContracts = $solAdditionalContracts
    saveOnChange()
  }

  function handleSelectSol(event, index) {
    if (event.detail.value === 'Browse...') {
      loadFilesFolder('sol', index)
      return
    }
    $solAdditionalContracts[index].mainFile = event.detail
    saveOnChange()
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
        {$solAdditionalContracts[index].mainContract ||
          `additional Contract ${index + 1}`}
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
          <button
            on:click={() => refreshFiles()}
            style="background: transparent; padding:0; border:none; margin-top:auto;"
          >
            <Select
              listOpen={isSolidityListOpen}
              iconProps={solidityIconsObj}
              items={$solFilesArr}
              Item={CustomItem}
              {Icon}
              {ClearIcon}
              on:select={e => handleSelectSol(e, index)}
              on:clear={e => handleClear(e, index)}
              placeholder="Additional solidity file"
              bind:value={$solAdditionalContracts[index].mainFile}
            />
          </button>
        </div>
        <div class="dark_input">
          <h3>Main contract name<span>*</span></h3>
          <CustomInput
            infoObj={infoObjArr.contractName}
            placeholder="className()"
            bind:bindValue={$solAdditionalContracts[index].mainContract}
            change={saveOnChange}
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
                <h3>
                  Directory containing solidity packages<span>*</span>
                </h3>
                <CustomInput
                  infoObj={infoObjArr.solPackages}
                  placeholder="CVT-Executables-Mac"
                  bind:bindValue={$solAdditionalContracts[index].compiler.exe}
                  change={saveOnChange}
                />
              </div>
              <div class="dark_input">
                <h3>Default soldity version to use<span>*</span></h3>
                <!-- no placeholder, this filed should have the default compiler selected by default -->
                <CustomInput
                  infoObj={infoObjArr.solCompiler}
                  placeholder="version: solc7.6"
                  bind:bindValue={$solAdditionalContracts[index].compiler.ver}
                  change={saveOnChange}
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
                    change={saveOnChange}
                  />
                </div>
                <div class="dark_input">
                  <CustomInput
                    infoObj={infoObjArr.link}
                    placeholder="Contract name"
                    bind:bindValue={obj.contractName}
                    change={saveOnChange}
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
                  bind:bindValue={$solAdditionalContracts[index].specifiMethod}
                  change={saveOnChange}
                />
              </div>
            </div>
          </div>
        </CollapseCard>
      </div>
    </div>
  </CollapseCard>
</div>
