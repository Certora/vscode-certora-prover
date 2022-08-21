<script>
  import CustomInput from './slots_and_utility/CustomInput.svelte'
  import { verification_message, solidityObj, specObj } from './stores/store.js'

  function saveOnChange() {
    let form = {
      solidyObj: $solidityObj,
      specObj: $specObj,
      verificatoinMessage: $verification_message,
    }
    vscode.postMessage({
      command: 'create-conf-file',
      payload: form,
    })
  }
</script>

<div class="card_parent_wrapper bg_dark">
  <div class="header header_contracts">
    <i class="codicon codicon-file" />
    <h3>Verification message</h3>
  </div>
  <div>
    <div class="input_wrapper input_single" style="margin-top: 8px;">
      <div class="dark_input">
        <CustomInput
          placeholder="Text message"
          bind:bindValue={$verification_message}
          change={saveOnChange}
        />
      </div>
    </div>
  </div>
</div>
