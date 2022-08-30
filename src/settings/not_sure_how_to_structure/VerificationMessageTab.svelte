<script>
  import CustomInput from './slots_and_utility/CustomInput.svelte'
  import { verification_message } from './stores/store.js'

  let infoObjArr = {
    msg: {
      infoText:
        'Adds a message description to your run, similar to a commit message. ',
      infoLink:
        'https://docs.certora.com/en/latest/docs/ref-manual/cli/options.html#msg',
      validator: 'alphaNum',
    },
  }
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
          infoObj={infoObjArr.msg}
        />
      </div>
    </div>
  </div>
</div>
