<script>
  /* ---------------------------------------------------------------------------------------------
   *  Verification message tab. Here the user types the verification message of the run.
   *-------------------------------------------------------------------------------------------- */

  import CustomInput from './components/CustomInput.svelte'
  import { verification_message, disableForm } from './stores/store.js'

  let infoObjArr = {
    msg: {
      infoText: 'Message describing the job.',
      infoLink:
        'https://docs.certora.com/en/latest/docs/prover/cli/options.html#msg',
      validator: 'spaceAndDash',
    },
  }
</script>

<div class="card_parent_wrapper bg_dark border-rd" style="margin-bottom:25px;">
  <div class="header header_contracts">
    <i class="codicon codicon-comment" />
    <h3>Verification Message</h3>
  </div>
  <div>
    <div class="input_wrapper input_single p-16 pt-0">
      <div class="dark_input">
        <CustomInput
          placeholder="Text message"
          disabledState={$disableForm}
          bind:bindValue={$verification_message}
          infoObj={infoObjArr.msg}
        />
      </div>
    </div>
  </div>
</div>
