<script>
  /* ---------------------------------------------------------------------------------------------
   *  Component that shows info abuot a property, and link to documentation
   *-------------------------------------------------------------------------------------------- */

  export let infoObj = {
    infoText: 'some text...',
    infoLink: 'https://google.com',
  }

  let showInfo = false
  let mouse_is_on_show_info = false
  function checkMouseLeave() {
    setTimeout(() => {
      if (mouse_is_on_show_info) return
      showInfo = false
    }, 100)
  }
</script>

<div class="icon_wrapper">
  <i
    class="codicon codicon-info"
    on:mouseenter={() => (showInfo = true)}
    on:mouseleave={checkMouseLeave}
  />
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
  .showtxt {
    display: none;
    position: absolute;
    background: var(--vscode-editorWidget-background);
    border: 1px solid var(--vscode-editorWidget-border);
    top: 25px;
    left: 0;
    width: 100%;
    overflow: hidden;
    word-break: break-word;
    white-space: break-spaces;
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
</style>
