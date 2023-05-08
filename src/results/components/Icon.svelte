<script>
  /* ---------------------------------------------------------------------------------------------
   *  Component that shows an icon
   *-------------------------------------------------------------------------------------------- */

  let showInfo = false
  let mouse_is_on_show_info = false
  function checkMouseLeave() {
    setTimeout(() => {
      if (mouse_is_on_show_info) return
      showInfo = false
    }, 100)
  }
</script>

<div class="icon_wrapper" class:selected={$$props.selected}>
  <button
    on:mouseenter={() => (showInfo = true)}
    on:mouseleave={checkMouseLeave}
  >
    <i class="codicon codicon-info" />
  </button>
  <button
    on:click|stopPropagation={() =>
      $$props.loadFilesFolder($$props.fileType, $$props.index)}
  >
    <i class="codicon codicon-folder-opened" />
  </button>
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
    {$$props.infoText}
  </p>
</div>
{#if $$props.invalid}
  <div style="margin-top:20px; margin-left:-4px;">
    <div class={$$props.invalid ? 'input_error_message' : ''}>
      {#if $$props.invalid}
        <i class={'codicon codicon-warning'} />
      {/if}
      {$$props.errorText}
    </div>
  </div>
{/if}

<style>
  .codicon {
    /* color: var(--dropdown-text-color); */
    color: var(--vscode-input-foreground);
  }
  .icon_wrapper {
    order: 3;
    margin-right: 10px;
    margin-left: auto;
    display: flex;
    z-index: 3;
  }
  button {
    background: none;
    border: 0;
    padding: 0;
    margin-left: 4px;
  }

  .codicon-folder-opened {
    border-radius: 5px;
    padding: 2px;
  }
  .codicon-folder-opened:hover {
    cursor: pointer;
    background-color: rgba(90, 93, 94, 0.31);
  }
  .selected {
    /* margin-right: 14px; */
  }

  .showtxt {
    display: none;
    position: absolute;
    background: var(--vscode-editorWidget-background);
    border: 1px solid var(--vscode-editorWidget-border);
    top: 29px;
    left: -1px;
    width: calc(100% - 16px);
    flex-direction: column;
    text-align: left;
    padding: 8px;
    z-index: 3;
    /* color: var(--dropdown-text-color); */
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
