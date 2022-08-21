<script>
  import Select from 'svelte-select'
  import ClearIcon from './slots_and_utility/ClearIcon.svelte'
  import CollapseCard from './slots_and_utility/CollapseCard.svelte'
  import Icon from './slots_and_utility/Icon.svelte'
  import CustomItem from './slots_and_utility/CustomItem.svelte'
  import CustomInput from './slots_and_utility/CustomInput.svelte'
  import {
    // re,ove solidtyObj when done
    solidityObj,
    solFilesArr,
    solAdditionalContracts,
  } from './stores/store.js'

  //   slots
  export let index
  export let solidityIconsObj
  export let updateItems
  export let solFiles

  let items = [
    { value: 'Browse...', label: 'Browse...', path: 'src/somefolder' },
    {
      value: 'chocolate asdsadas asdsadsad asdsad',
      label: 'Chocolate sdfdsfsdfs sdf sdfdsfsdf ',
      group: 'Sweet',
      monkey: 'monkey',
    },
    { value: 'pizza', label: 'Pizza', group: 'Savory' },
    {
      value: 'src/somefolder/cake.sol',
      label: 'Cake.sol',
      path: 'src/somefolder',
    },
    { value: 'cookies', label: 'Cookies', group: 'Savory' },
    { value: 'ice-cream', label: 'Ice Cream', group: 'Sweet' },
  ]

  // browse logic option one
  let test = 'test'
  $: test, testFunc()
  function testFunc() {
    if (test && test.value && test.value === 'Browse...') {
      test = undefined
    }
    console.log(test)
  }

  // browse logic option 2 .sol
  function handleSelectSol(event) {
    if (event.detail.value === 'Browse...') {
      console.log('did something')
      handleClear()
      return
    }
    testObj.selected = true
    $solidityObj.mainFile = event.detail.value
  }

  function handleSelect(event) {}

  function handleClear() {
    testObj.selected = false
  }
  function someFunc() {
    console.log('doing stuffs')
  }
  let testObj = {
    selected: false,
    info: 'abc',
    someFunc: someFunc,
  }

  // push new linking/directory
  function pushNewObj(arr, obj) {
    arr.push(obj)
    // $solidityObj.solidityPackageDir = $solidityObj.solidityPackageDir
    $solidityObj = $solidityObj
  }
  // remove from linking/directory
  function removeObj(arr, index) {
    arr.splice(index, 1)
    // $solidityObj.solidityPackageDir = $solidityObj.solidityPackageDir
    $solidityObj = $solidityObj
  }

  // remove solidity file by index
  function removeSolFile(index) {
    $solAdditionalContracts.splice(index, 1)
    $solAdditionalContracts = $solAdditionalContracts
  }

  let solInputValue = ''
  let isSolidityListOpen = false
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
              listOffset="0"
              iconProps={solidityIconsObj}
              items={solFiles}
              Item={CustomItem}
              {Icon}
              {ClearIcon}
              on:select={e => handleSelectSol(e, index)}
              on:clear={() => handleClear(index)}
              placeholder="Additional solidity file"
              bind:value={solInputValue}
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
            {#each $solAdditionalContracts[index].linking as obj, index}
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
