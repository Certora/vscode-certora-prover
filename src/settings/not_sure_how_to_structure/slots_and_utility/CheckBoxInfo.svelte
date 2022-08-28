<script>
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
    top: 30px;
    left: 0;
    min-width: max-content;
    width: 100%;
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
