<script>
  export let placeholder = 'placeholder'
  export let bindValue

  export let infoObj = {
    infoText: 'some text...',
    infoLink: 'https://google.com',
  }

  let mouse_is_on_input = false
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
      mouse_is_on_input = false
      icon_wrapper = false
    }, 100)
  }
</script>

<div>
  <input
    class="simple_txt_input"
    type="text"
    bind:value={bindValue}
    {placeholder}
    on:mouseenter={() => (mouse_is_on_input = true)}
    on:mouseleave={checkMouseLeaveInput}
  />

  <div
    class="icon_wrapper"
    on:mouseenter={() => (icon_wrapper = true)}
    on:mouseleave={() => ((mouse_is_on_input = false), (icon_wrapper = false))}
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
    <i
      class="codicon codicon-info"
      on:mouseenter={() => (showInfo = true)}
      on:mouseleave={checkMouseLeave}
      style={mouse_is_on_input ? '' : 'display:none;'}
    />
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
      {infoObj.infoText}
    </p>
    <a href={infoObj.infoLink}>link to documentation</a>
  </div>
</div>

<style>
  /* stylelint-disable */

  div {
    position: relative;
    margin-top: auto;
  }

  .icon_wrapper {
    position: absolute;
    right: 4px;
    top: 50%;
    transform: translateY(-50%);
    display: flex;
    align-items: center;
    gap: 4px;
  }

  input {
    width: -webkit-fill-available;
  }
  i {
    color: var(--dropdown-text-color);
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
    z-index: 1;
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
</style>
