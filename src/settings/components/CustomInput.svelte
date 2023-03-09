<script>
  /* ---------------------------------------------------------------------------------------------
   *  Component that shows a custom string input box
   *-------------------------------------------------------------------------------------------- */

  import {
    emailValidator,
    spaceAndDashValidator,
    numberValidator,
    filePathValidator,
    compilerValidator,
    messageAndNameValidator,
    contractValidators,
  } from '../validations/validators.js'
  import { createFieldValidator } from '../validations/validation.js'
  import { Source } from '../types'

  import { badInputs, checkMyInputs } from '../stores/store'

  export let placeholder = 'placeholder'
  export let bindValue
  export let disabledState = false
  export let source
  let flag = false

  export let infoObj = {
    infoText: 'some text...',
    infoLink: 'https://google.com',
    validator: '',
  }
  let validator

  function setValidator() {
    if (!infoObj.validator || infoObj.validator === 'alphaNum') {
      validator = emailValidator()
      return
    }
    if (infoObj.validator === 'number') {
      validator = numberValidator()
      return
    }
    if (infoObj.validator === 'spaceAndDash') {
      validator = spaceAndDashValidator()
      return
    }

    if (infoObj.validator === 'filePathValidator') {
      validator = filePathValidator()
      return
    }

    if (infoObj.validator === 'compilerValidator') {
      validator = compilerValidator()
      return
    }

    if (infoObj.validator === 'messageAndNameValidator') {
      validator = messageAndNameValidator()
      return
    }
    if (infoObj.validator === 'contractValidator') {
      validator = contractValidators()
      return
    }
    if ((infoObj.validator = 'valueValidator')) {
      validator = value => {
        return true
      }
      return
    }
    validator = compilerValidator()
  }
  setValidator()

  const [validity, validate] = createFieldValidator(validator)

  let icon_wrapper = false
  let showInfo = false
  let mouse_is_on_show_info = false
  function checkMouseLeave() {
    setTimeout(() => {
      if (mouse_is_on_show_info) return
      showInfo = false
    }, 100)
  }
  function checkMouseLeaveInput() {
    setTimeout(() => {
      if (icon_wrapper) return
      icon_wrapper = false
    }, 100)
  }

  $: $validity, checkAllInputs()

  function checkAllInputs() {
    // get all the inputs
    // setTimeout is there to "hack" the fact that the store value is updated before the dom error message
    setTimeout(() => {
      let inputs = document.querySelectorAll('.simple_txt_input')
      inputs = Array.from(inputs)
      $checkMyInputs = inputs.some(el => {
        if (el.classList.contains('field-danger')) return true
      })
      if (!$validity.valid) {
        if (source === Source.Sol && !flag) {
          $badInputs.sol += 1
          flag = true
        }
        if (source === Source.Spec && !flag) {
          $badInputs.spec += 1
          flag = true
        }
        if (source === Source.Msg && !flag) {
          $badInputs.msg += 1
          flag = true
        }
      } else {
        if (source === Source.Sol && flag) {
          $badInputs.sol -= 1
          flag = false
        }
        if (source === Source.Spec && flag) {
          $badInputs.spec -= 1
          flag = false
        }
        if (source === Source.Msg && flag) {
          $badInputs.msg -= 1
          flag = false
        }
      }
    })
  }
</script>

<div class="main_wrapper">
  <!-- no info icon on disabled -->
  <!-- disabled = {disabledState} -->
  <input
    disabled={disabledState}
    class="simple_txt_input monaco-inputbox idle"
    type="text"
    maxlength="255"
    bind:value={bindValue}
    {placeholder}
    on:mouseleave={checkMouseLeaveInput}
    class:field-danger={!$validity.valid}
    use:validate={bindValue}
  />

  {#if !$validity.valid}
    <!-- validation message -->
    <div class="input_error_message mt-8px">
      <i class="codicon codicon-warning" />
      {$validity.message}
    </div>
  {/if}
  <div
    class="icon_wrapper"
    on:mouseenter={() => (icon_wrapper = true)}
    on:mouseleave={() => (icon_wrapper = false)}
  >
    {#if bindValue !== ''}
      <i
        class="codicon codicon-close"
        on:click={() => {
          bindValue = ''
          icon_wrapper = false
        }}
      />
    {/if}
    {#if infoObj.infoLink !== ''}
      <i
        class="codicon codicon-info"
        on:mouseenter={() => (showInfo = true)}
        on:mouseleave={checkMouseLeave}
      />
    {/if}
  </div>
  <div
    class="showtxt"
    class:hovering={showInfo}
    on:mouseenter={() => (mouse_is_on_show_info = true)}
    on:mouseleave={() => {
      ;(showInfo = false), (mouse_is_on_show_info = false)
    }}
  >
    <p>
      {@html infoObj.infoText}
    </p>
    <a href={infoObj.infoLink}>link to documentation</a>
  </div>
</div>

<style>
  /* stylelint-disable */
  /* *{
    box-sizing: border-box;
  } */
  .main_wrapper {
    position: relative;
    margin-top: auto;
  }

  .icon_wrapper {
    position: absolute;
    right: 4px;
    top: 5px;
    /* top: 50%;
    transform: translateY(-50%); */
    display: flex;
    align-items: center;
    gap: 4px;
  }
  i {
    color: var(--vscode-input-foreground);
  }

  .showtxt {
    display: none;
    position: absolute;
    background: var(--vscode-editorWidget-background);
    border: 1px solid var(--vscode-editorWidget-border);
    top: 30px;
    left: 0;
    width: calc(100% - 18px);
    flex-direction: column;
    text-align: left;
    padding: 8px;
    z-index: 3;
  }
  .showtxt a {
    margin-top: 8px;
    text-decoration: none;
  }
  .showtxt p {
    margin: 0;
  }

  .hovering {
    display: flex;
  }

  .simple_txt_input {
    box-sizing: border-box;
    border: none;
    color: var(--vscode-input-foreground);
    padding: 6px 53px 6px 4px;
    height: 30px;
    width: -webkit-fill-available;
    background: var(--vscode-input-background);
    font-size: var(--inputFontSize, 14px);
  }
  .simple_txt_input::placeholder {
    color: var(--vscode-input-placeholderForeground);
  }
  .simple_txt_input:hover,
  .simple_txt_input:focus,
  .field-danger {
    cursor: pointer;
    outline: 1px solid var(--vscode-inputValidation-infoBorder);
    outline-offset: -1px;
  }
  .simple_txt_input.field-danger,
  .field-danger:focus,
  .field-danger:hover {
    outline-color: var(--vscode-editorError-foreground);
  }
</style>
