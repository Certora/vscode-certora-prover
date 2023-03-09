<script>
  /* ---------------------------------------------------------------------------------------------
   *  Verification message tab. Here the user types the verification message of the run.
   *-------------------------------------------------------------------------------------------- */

  import CustomInput from './components/CustomInput.svelte'
  import { verification_message, disableForm } from './stores/store.js'
  import { Source } from './types'

  let infoObjArr = {
    msg: {
      infoText: 'Message describing the job.',
      infoLink:
        'https://docs.certora.com/en/latest/docs/prover/cli/options.html#msg',
      validator: 'filePathValidator',
    },
  }
</script>

<div
  class={'card_parent_wrapper bg_dark border-rd ' +
    ($disableForm ? 'disable_main' : '')}
  style="margin-bottom:25px;"
>
  <div class="header header_contracts">
    <i class="codicon codicon-comment" />
    <h3>Verification Message</h3>
  </div>
  <div>
    <div class="input_wrapper input_single p-16 pt-0">
      <div class="dark_input">
        <CustomInput
          placeholder="Text message"
          bind:bindValue={$verification_message}
          infoObj={infoObjArr.msg}
          source={Source.Msg}
        />
      </div>
    </div>
  </div>
</div>

<style>
  .disable_main {
    opacity: 0.4;
    pointer-events: none;
  }

  .disable_main *:hover {
    all: unset !important;
  }
</style>
