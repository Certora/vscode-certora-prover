<script>
  import Select from 'svelte-select'
  import ClearIcon from './slots_and_utility/ClearIcon.svelte'
  import CollapseCard from './slots_and_utility/CollapseCard.svelte'
  import Icon from './slots_and_utility/Icon.svelte'
  import CustomItem from './slots_and_utility/CustomItem.svelte'
  import CustomInput from './slots_and_utility/CustomInput.svelte'
  import { solAdditionalContracts } from './stores/store.js'

  //   slots
  export let index
  export let updateItems
  export let solFiles
  export let handleSelectSol
  export let handleClear
  export let loadFilesFolder

  let isSolidityListOpen = false
  let solidityIconsObj = {
    selected: isSolidityListOpen,
    loadFilesFolder: loadFilesFolder,
    fileType: 'sol',
    index: index,
    ifoText: 'some string',
    infoLink: 'www.google.com',
  }

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
</script>

<div class="card_body_wrapper_parent bg_light">
  <CollapseCard>
    <div slot="header" class="header header_contract no_border_padding">
      <i class="codicon codicon-file" />
      <h3>
        {$solAdditionalContracts[index].mainContract ||
          `additional Contract ${index + 1}`}
      </h3>
      <i
        class="codicon codicon-trash"
        on:click|stopPropagation={() => removeSolFile(index)}
      />
      <i class="codicon codicon-chevron-up" />
    </div>
    <div slot="body" class="card_body_wrapper">
      <div class="input_wrapper" style="margin-top: 8px;">
        <div class="dark_input">
          <h3>Source<span>*</span></h3>
          <!-- items={$solFilesArr} -->
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
              on:select={e => handleSelectSol(e, 'sol', index)}
              on:clear={e => handleClear(e, index)}
              placeholder="Additional solidity file"
              bind:value={$solAdditionalContracts[index].mainFile}
            />
          </button>
        </div>
        <div class="dark_input">
          <h3>Main contract name<span>*</span></h3>
          <CustomInput
            placeholder="className()"
            bind:bindValue={$solAdditionalContracts[index].mainContract}
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
                  bind:bindValue={$solAdditionalContracts[index].compiler.exe}
                />
              </div>
              <div class="dark_input">
                <h3>Default soldity version to use<span>*</span></h3>
                <!-- no placeholder, this filed should have the default compiler selected by default -->
                <CustomInput
                  placeholder="version: solc7.6"
                  bind:bindValue={$solAdditionalContracts[index].compiler.ver}
                />
              </div>
            </div>
          </div>
        </CollapseCard>
      </div>
      <div class="card_body_wrapper_parent bg_dark mt-8px">
        <CollapseCard open={false}>
          <div slot="header" class="header header_contract">
            <i class="codicon codicon-gear" />
            <h3>Linking</h3>
            <i class="codicon codicon-chevron-up" />
          </div>
          <div slot="body" class="card_body_wrapper">
            {#each $solAdditionalContracts[index].linking as obj, i}
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
                  on:click={removeObj(
                    $solAdditionalContracts[index].linking,
                    i,
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
                  bind:bindValue={$solAdditionalContracts[index].specifiMethod}
                />
              </div>
            </div>
          </div>
        </CollapseCard>
      </div>
    </div>
  </CollapseCard>
</div>
