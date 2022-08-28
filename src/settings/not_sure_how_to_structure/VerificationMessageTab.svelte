<script>
  import CustomInput from './slots_and_utility/CustomInput.svelte'
  import { verification_message } from './stores/store.js'
</script>

<div class="card_parent_wrapper bg_dark border-rd">
  <div class="header header_contracts">
    <i class="codicon codicon-file" />
    <h3>Verification message</h3>
  </div>
  <div>
    <div class="input_wrapper input_single p-16 pt-0">
      <div class="dark_input">
        <CustomInput
          placeholder="Text message"
          bind:bindValue={$verification_message}
        />
      </div>
    </div>
  </div>
</div>
