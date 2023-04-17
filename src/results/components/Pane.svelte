<script lang="ts">
  /* ---------------------------------------------------------------------------------------------
   *  Component that has a title, an option to expend and action buttons
   *-------------------------------------------------------------------------------------------- */

  import Toolbar from './Toolbar.svelte'
  import { Action, Status } from '../types'
  import { getIconPath } from '../utils/getIconPath'
  import { expandables } from '../store/store'

  export let title: string
  export let actions: Action[] = []
  export let fixedActions: Action[] = []
  export let showExpendIcon: boolean = true
  export let status: Status | string = ''
  export let inactiveSelected: boolean = false
  export let runFunc: () => void = null
  export let isExpanded = false

  const statusIcons = {
    missingSettings: 'finish-setup.svg',
    ready: 'ready-to-run.svg',
    running: 'running-rule-status.svg',
    pending: 'pending.svg',
    success: 'rerun-success.svg',
    unableToRun: 'unable-to-run.svg',
    settingsError: 'error-rule-status.svg',
  }

  // maps status to icon
  const statusMap: Map<string, string> = new Map([
    [Status.missingSettings, statusIcons.missingSettings],
    [Status.running, statusIcons.running],
    [Status.ready, statusIcons.ready],
    [Status.pending, statusIcons.pending],
    [Status.success, statusIcons.success],
    [Status.unableToRun, statusIcons.unableToRun],
    [Status.incompleteResults, statusIcons.running],
    [Status.settingsError, statusIcons.settingsError],
  ])

  // add to expandables
  if (
    $expandables.find(element => {
      return element.title === title
    }) === undefined
  ) {
    $expandables.push({
      title: title,
      isExpanded: false,
      tree: [],
    })
  }

  /**
   * panel class can change the panels cursor and show if its selected
   */
  function getPaneClassName(): string {
    let className = 'pane-header'
    if (status !== Status.pending && status !== Status.running) {
      className += ' pointer-cursor'
    }
    if (inactiveSelected) {
      className += ' inactive-selected'
    }
    return className
  }

  /**
   * icon class can either have normal / pointer cursor
   */
  function getIconClassName(): string {
    let className = 'icon'
    if (runFunc) {
      className += ' pointer-cursor' + ' icon-hover'
    } else {
      className += ' arrow-curser'
    }
    return className
  }

  function toggleExpand() {
    // if (
    //   $expandables.find(element => {
    //     return element.title === title
    //   }) === undefined
    // ) {
    //   $expandables.push({
    //     title: title,
    //     isExpanded: false,
    //     tree: [],
    //   })
    // }
    // $expandables = $expandables.map(element => {
    //   if (element.title === title) {
    //     element.isExpanded = !element.isExpanded
    //   }
    //   return element
    // })
    isExpanded = !isExpanded
  }
</script>

<div class="pane" class:expanded={isExpanded} id={title}>
  <div
    class={getPaneClassName()}
    on:click={toggleExpand}
    tabindex="0"
    role="button"
    aria-label={`${title} section`}
    aria-expanded={isExpanded}
  >
    {#if showExpendIcon}
      <div
        class="arrow-icon codicon codicon-chevron-{isExpanded
          ? 'down'
          : 'right'}"
      />
    {:else}
      <div class="no-icon" />
    {/if}
    {#if status}
      <img
        class={getIconClassName()}
        width="16"
        height="16"
        src={getIconPath(statusMap.get(status))}
        alt=""
        title={runFunc ? 'Run' : status}
        on:click|stopPropagation={runFunc}
      />
    {/if}
    <h3 class="title" {title}>{title}</h3>
    <div class="actions">
      <Toolbar {actions} />
    </div>
    <div class="status">
      {status === Status.success ? Status.ready : status}
    </div>
    <div class="fixed-actions">
      <Toolbar actions={fixedActions} />
    </div>
  </div>
  {#if isExpanded}
    <div class="pane-body">
      <slot />
    </div>
  {/if}
</div>

<style lang="postcss">
  .pane-header {
    position: relative;
    display: flex;
    overflow: hidden;
    height: var(--height);
    box-sizing: border-box;
    align-items: center;
    border-top: 1px solid var(--pane-border-color);
    cursor: default;
    font-size: var(--font-size);
    font-weight: 700;

    .arrow-icon {
      margin: 0 2px;
    }

    .icon {
      margin-right: 7px;
      margin-left: 2px;
    }

    .icon-hover {
      &:hover {
        border-radius: 20px;
        border: 0px solid rgb(184 184 184 / 31%);
        background: var(--foreground);
      }
    }

    .no-icon {
      margin: 10px;
    }

    .title {
      overflow: hidden;
      min-width: 3ch;
      font-size: var(--font-size);
      font-weight: normal !important;
      line-height: var(--height);
      -webkit-margin-after: 0;
      -webkit-margin-before: 0;
      text-overflow: ellipsis;
      white-space: nowrap;
    }

    .status {
      position: relative;
      display: initial;
      padding-right: 10px;
      margin-left: auto !important;
      font-size: 11px;
      font-weight: normal !important;
      opacity: 0.8;
    }

    .actions {
      position: relative;
      display: none;
      margin-left: auto;
    }

    .fixed-actions {
      /* margin-left: auto; */
    }

    &:hover .actions {
      display: initial;
    }

    &:hover .status {
      display: none;
    }

    &:hover {
      background-color: var(--vscode-list-hoverBackground);
    }
  }

  *:focus {
    background-color: var(--vscode-list-activeSelectionBackground);
    outline-color: var(--vscode-list-focusHighlightForeground);
  }

  *:selection {
    background-color: var(--vscode-list-activeSelectionBackground);
  }

  .pane {
    --height: 22px;
    --font-size: 13px;

    display: flex;
    overflow: hidden;
    width: 100%;
    height: 100%;
    flex-direction: column;
    user-select: none;

    &:first-of-type .pane-header {
      border-top: none;
    }
  }

  .pane-body {
    overflow: hidden;
    flex: 1;
  }

  .pointer-cursor {
    cursor: pointer !important;
  }

  .arrow-curser {
    cursor: default !important;
  }

  .inactive-selected {
    background-color: var(--vscode-editor-inactiveSelectionBackground);
  }
</style>
