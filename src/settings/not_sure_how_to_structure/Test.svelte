<script>
  import Select from 'svelte-select'
  import ClearIcon from './slots_and_utility/ClearIcon.svelte'
  import CollapseCard from './slots_and_utility/CollapseCard.svelte'
  import Icon from './slots_and_utility/Icon.svelte'
  import CustomInput from './slots_and_utility/CustomInput.svelte'
  import { refreshFiles } from '../utils/refreshFiles'
  import { log, Sources } from '../utils/log'
  import {
    navState,
    resetNav,
    solidityObj,
    solFilesArr,
    specObj,
  } from './stores/store.js'

  let items = [
    {
      value: 'chocolate',
      label: 'Chocolate',
      group: 'Sweet',
      monkey: 'monkey',
    },
    { value: 'pizza', label: 'Pizza', group: 'Savory' },
    { value: 'cake', label: 'Cake', group: 'Sweet' },
    { value: 'cookies', label: 'Cookies', group: 'Savory' },
    { value: 'ice-cream', label: 'Ice Cream', group: 'Sweet' },
  ]

  let favouriteFood = undefined

  function handleSelectSol(event) {
    $solidityObj.mainFile = event.detail.value
    saveOnChange()
  }

  function handleSelectInputField(event) {
    console.log('event was handled')
    saveOnChange()
  }

  //todo: add handleSelect for every field

  function handleSelect(event) {}

  function handleClear() {
    favouriteFood = undefined
  }

  function openBrowser(fileType) {
    log({
      action: 'Send "open-browser" command',
      source: Sources.SettingsWebview,
    })
    vscode.postMessage({
      command: 'open-browser',
      payload: fileType,
    })
  }

  function saveOnChange() {
    let form = {
      solidyObj: $solidityObj,
      specObj: $specObj,
    }
    log({
      action: 'Send "create-conf-file" command',
      source: Sources.SettingsWebview,
      info: form,
    })
    vscode.postMessage({
      command: 'create-conf-file',
      payload: form,
    })
  }
</script>

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
                <!-- refresh files when component is pressed -->
                <div on:click={refreshFiles}>
                  <Select
                    items={$solFilesArr}
                    value={$solidityObj.mainFile}
                    {Icon}
                    {ClearIcon}
                    on:select={handleSelectSol}
                    on:clear={handleClear}
                    placeholder="Main solidity file"
                  />
                </div>
                <!-- browse example -->
                <button
                  on:click={() => {
                    openBrowser('sol')
                  }}>Browse</button
                >
              </div>
              <div class="dark_input">
                <h3>Main contract name<span>*</span></h3>
                <CustomInput
                  placeholder="className()"
                  bind:bindValue={$solidityObj.mainContract}
                  change={handleSelectInputField}
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
                        change={handleSelectInputField}
                      />
                    </div>
                    <div class="dark_input">
                      <h3>Default soldity version to use<span>*</span></h3>
                      <!-- no placeholder, this filed should have the default compiler selected by default -->
                      <CustomInput
                        placeholder="version: solc7.6"
                        bind:bindValue={$solidityObj.compiler.ver}
                        change={handleSelectInputField}
                      />
                    </div>
                    <i class="codicon codicon-trash" />
                  </div>

                  <!-- validation message -->
                  <!-- <div class="input_error_message">
                    <i class="codicon codicon-warning" />
                    Validation message
                    <a target="_blank">Optional link to docs</a>
                  </div> -->

                  <!-- advanced settings -->
                  <div class="card_body_wrapper_parent bg_light mt-8px">
                    <CollapseCard>
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
                        <div class="input_wrapper">
                          <div class="dark_input">
                            <h3>Solidity package directories</h3>
                            <Select
                              {items}
                              {Icon}
                              {ClearIcon}
                              on:select={handleSelect}
                              on:clear={handleClear}
                              placeholder="Package name"
                            />
                          </div>
                          <div class="dark_input">
                            <h3>&nbsp;</h3>
                            <Select
                              {items}
                              {Icon}
                              {ClearIcon}
                              on:select={handleSelect}
                              on:clear={handleClear}
                              placeholder=".../path"
                            />
                          </div>
                          <i class="codicon codicon-trash" />
                        </div>

                        <button class="btn_add"
                          ><i class="codicon codicon-add" /> Add Directory</button
                        >
                      </div>
                    </CollapseCard>
                  </div>
                </div>
              </CollapseCard>
            </div>
            <div class="card_body_wrapper_parent bg_dark mt-8px">
              <CollapseCard>
                <div slot="header" class="header header_contract">
                  <i class="codicon codicon-gear" />
                  <h3>Linking</h3>
                  <i class="codicon codicon-chevron-up" />
                </div>
                <div slot="body" class="card_body_wrapper">
                  <div class="input_wrapper">
                    <div class="dark_input">
                      <CustomInput
                        placeholder="Variable"
                        bind:bindValue={$solidityObj.linking[0].variable}
                      />
                    </div>
                    <div class="dark_input">
                      <CustomInput
                        placeholder="Contract name"
                        bind:bindValue={$solidityObj.linking[0].contractName}
                      />
                    </div>
                    <i class="codicon codicon-trash" />
                  </div>

                  <button class="btn_add"
                    ><i class="codicon codicon-add" /> Add Link</button
                  >
                </div>
              </CollapseCard>
            </div>
            <div class="card_body_wrapper_parent bg_dark mt-8px">
              <CollapseCard>
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

      <button class="btn_add"
        ><i class="codicon codicon-add" /> Add another contract</button
      >
    </div>
  </CollapseCard>
</div>
