<script lang="ts">
  /* ---------------------------------------------------------------------------------------------
   *  Shows all the information of a run: run name, status, action buttons etc.
   *-------------------------------------------------------------------------------------------- */

  import { getIconPath } from '../utils/getIconPath'
  import ContextMenu from '../components/ContextMenu.svelte'

  import {
    Verification,
    TreeType,
    Job,
    Rule,
    Assert,
    Action,
    Status,
  } from '../types'
  import Pane from './Pane.svelte'
  import Tree from './Tree.svelte'
  import { verificationResults } from '../store/store'
  import { writable } from 'svelte/store'
  import { clearResults } from '../extension-actions'

  export let editFunc: () => void
  export let deleteFunc: () => void
  export let deleteRun: () => void
  export let namesMap: Map<string, string>
  export let runName: string = ''
  const renameJob = writable(runName === '')
  // this creates the new conf file
  export let renameRun: (oldName: string, newName: string) => void
  export let duplicateFunc: (
    nameToDuplicate: string,
    duplicatedName: string,
    rule?: string,
  ) => void
  export let runFunc: () => void
  export let newFetchOutput: (
    e: CustomEvent<Assert | Rule>,
    vr: Verification,
  ) => void

  export let expandedState = false
  export let nowRunning = false

  export let isPending = false

  export let pendingStopFunc: () => void
  export let runningStopFunc: () => void

  export let inactiveSelected: string = ''

  export let setStatus: (name: string, status: Status) => void

  export let status: Status

  export let vrLink = ''

  export let hide = true

  export let pos

  let beforeRename = ''

  const UNTITLED = 'untitled'

  function onKeyPress(e: any): void {
    // get out of 'rename' mode when enter is pressed
    if (e.key === 'Enter') {
      $renameJob = false

      // we use untitled as default name, when creating a new run
      if (e.currentTarget.value === createInitialName()) {
        runName = UNTITLED
        titleHandle()
        renameRun('', spacesToUnderscores(runName))
      }

      // if user entered empty run name in rename mode
      if (!e.currentTarget.value && !runName) {
        runName = UNTITLED
        titleHandle()
        renameRun('', spacesToUnderscores(runName))
      }
    }
  }

  function createInitialName() {
    if (namesMap.has(UNTITLED)) {
      return duplicateName(UNTITLED)
    }
    return UNTITLED
  }

  /**
   * returns a name for a duplicated item
   * example: name => name (1)
   */
  function duplicateName(name: string): string {
    let nameToDuplicate = name
    if (namesMap.has(name)) {
      nameToDuplicate = namesMap.get(name)
    }
    let counter = 1
    let currentName = renameDuplicate(nameToDuplicate, counter)
    while (namesMap.has(spacesToUnderscores(currentName))) {
      counter++
      currentName = renameDuplicate(nameToDuplicate, counter)
    }
    return currentName
  }

  /**
   * process a title so it can become a suitable run name
   * a run name cannot contain spaces in the beginning/end of the name,
   * cannot have multiple spaces in a row, cannot contain special characters
   * outside space.
   * run name that only contains illegal characters and spaces will become 'untitled'
   */
  function titleHandle(): void {
    runName = runName
      .replace(/[^a-zA-Z0-9_ ]/g, '')
      .replace(/ +/g, ' ')
      .trim()
    if (runName === '') {
      runName = UNTITLED
    }
    // already been
    if (namesMap.has(spacesToUnderscores(runName))) {
      runName = duplicateName(runName)
    }
    namesMap.set(spacesToUnderscores(runName), runName)
    runName = spacesToUnderscores(runName)
  }

  function renameDuplicate(name: string, counter: number): string {
    return name + ' (' + counter.toString() + ')'
  }

  function spacesToUnderscores(name: string): string {
    return name.replaceAll(' ', '_')
  }

  function onChange(
    e: Event & {
      currentTarget: EventTarget & HTMLInputElement
    },
  ) {
    // this function doe'nt handle empty input
    if (!e.currentTarget.value) {
      return
    }
    runName = e.currentTarget.value
    titleHandle()
    // in rename mode we rename
    if (e.currentTarget.value) {
      renameRun(beforeRename, spacesToUnderscores(runName))
    }
  }

  /**
   * get into rename mode
   */
  function setRename(): void {
    $renameJob = true
    beforeRename = runName
  }

  /**
   * returns the status for a run that was just ran
   */
  function getRunStatus(): Status {
    if (isPending) {
      statusChange(Status.pending)
    } else if (nowRunning) {
      statusChange(Status.running)
    }
    return status
  }

  /**
   * duplicate this run
   */
  function duplicate(rule?: string): void {
    let duplicatedName = rule ? runName + ' ' + rule : runName
    if (namesMap.has(spacesToUnderscores(duplicatedName))) {
      duplicatedName = duplicateName(duplicatedName)
    }
    namesMap.set(spacesToUnderscores(duplicatedName), duplicatedName)
    duplicateFunc(runName, spacesToUnderscores(duplicatedName), rule)
  }

  /**
   * creates actions for the missingSettings, ready and unableToRun statuses.
   * the actions are: rename, edit, delete, duplicate, and if possible: run
   */
  function createActions(): Action[] {
    let actions: Action[] = [
      {
        title: 'Edit',
        icon: 'gear',
        onClick: editFunc,
      },
      {
        title: 'Delete',
        icon: 'trash',
        onClick: deleteFunc,
      },
      {
        title: 'Duplicate',
        icon: 'files',
        onClick: () => {
          duplicate()
        },
      },
    ]
    return actions
  }

  /**
   * creates actions for the missingSettings, ready and unableToRun statuses.
   * the actions are: rename, edit, delete, duplicate, and if possible: run
   */
  function createFixedActions(): Action[] {
    let actions: Action[] = []
    let goToRuleReportAction = {
      title: 'Go To Rule Report',
      icon: 'file-symlink-file',
      link: vrLink,
      disabled: true,
    }
    if (vrLink) {
      goToRuleReportAction.link = vrLink
      goToRuleReportAction.disabled = false
    }
    actions.push(goToRuleReportAction)
    return actions
  }

  /**
   * creates actions for the missingSettings, ready and unableToRun statuses.
   * the actions are: rename, edit, delete, duplicate, and if possible: run
   */
  function createActionsForContextMenu(): Action[] {
    let actions: Action[] = [
      {
        title: 'Edit',
        icon: 'gear',
        onClick: editFunc,
      },
      {
        title: 'Delete',
        icon: 'trash',
        onClick: deleteFunc,
      },
      {
        title: 'Duplicate',
        icon: 'files',
        onClick: duplicate,
      },
    ]
    if (status === Status.incompleteResults) {
      actions.push({
        title: 'Stop',
        icon: 'stop-circle',
        onClick: runningStopFunc,
      })
    } else {
      actions = [
        {
          title: 'Rename',
          icon: 'edit',
          onClick: setRename,
        },
        ...actions,
      ]
    }
    if (
      $verificationResults.find(vr => {
        return vr.name === runName
      }) !== undefined
    ) {
      actions.push({
        title: 'Clear Results',
        icon: '',
        onClick: () => {
          clearResults(runName)
        },
      })
    }
    return actions
  }

  /**
   * change run status
   * @param newStatus status to change to
   */
  function statusChange(newStatus: Status): void {
    status = newStatus
    setStatus(runName, newStatus)
  }

  /**
   * stops a pending run
   */
  function pendingRunStop(): void {
    statusChange(Status.ready)
    pendingStopFunc()
    isPending = false
  }

  /**
   * creates 'stop' action according to run status
   */
  function createActionsForRunningScript(): Action[] {
    if (isPending) {
      return [
        {
          title: 'Edit',
          icon: 'gear',
          onClick: editFunc,
        },
        {
          title: 'Stop',
          icon: 'stop-circle',
          onClick: pendingRunStop,
        },
      ]
    }
    if (nowRunning) {
      return [
        {
          title: 'Edit',
          icon: 'gear',
          onClick: editFunc,
        },
        {
          title: 'Stop',
          icon: 'stop-circle',
          disabled: vrLink ? false : true,
          onClick: vrLink ? runningStopFunc : null,
        },
      ]
    }
    return []
  }

  /**
   * if this job has no name - delete!
   */
  function deleteOutOfFocus() {
    if (!runName) {
      deleteRun()
    }
    var activeElement = document.activeElement
    var myElement = document.getElementById('rename_input ' + runName)
    if (activeElement !== myElement) {
      $renameJob = false
    }
  }

  // was copied from App.svelte
  function retrieveRules(jobs: Job[]): Rule[] {
    // rulesArrays = [Rule[] A, Rule[]B,...]
    const rulesArrays: Rule[][] = jobs.map(
      job => job.verificationProgress.rules,
    )
    return [].concat(...rulesArrays)
  }

  /** focus on this element */
  function focusOnThis(element) {
    element.focus()
  }

  function onClick(e) {
    if (!expandedState) {
      editFunc()
    }
  }
</script>

<div class="body">
  {#if $renameJob}
    <div class="renameInput">
      <img
        class="icon"
        width="16"
        height="16"
        src={getIconPath('pending.svg')}
        alt=""
      />
      <input
        id={'rename_input ' + runName}
        use:focusOnThis
        on:focusout={deleteOutOfFocus}
        type="text"
        maxlength="35"
        class="input"
        value={namesMap.get(runName) || createInitialName()}
        placeholder="Enter run name"
        on:keypress={onKeyPress}
        on:change={onChange}
      />
    </div>
  {:else if !nowRunning}
    {#key [status, inactiveSelected]}
      <div class="results" on:click={onClick}>
        <Pane
          title={namesMap.get(runName)}
          actions={createActions()}
          fixedActions={createFixedActions()}
          showExpendIcon={expandedState}
          {status}
          inactiveSelected={runName === inactiveSelected}
          runFunc={status === Status.ready ||
          status === Status.success ||
          status === Status.unableToRun
            ? runFunc
            : null}
        >
          {#each $verificationResults as vr, index (index)}
            {#if vr.name === runName}
              <li
                class="tree"
                on:contextmenu|stopPropagation|preventDefault={() => null}
              >
                <Tree
                  runDisplayName={namesMap.get(runName)}
                  data={{
                    type: TreeType.Rules,
                    tree: retrieveRules(vr.jobs),
                    duplicateFunc: duplicate,
                  }}
                  jobEnded={status !== Status.incompleteResults}
                  on:fetchOutput={e => newFetchOutput(e, vr)}
                />
              </li>
            {/if}
          {/each}
        </Pane>
      </div>
    {/key}
  {:else}
    {#key [vrLink]}
      <div
        class="running"
        on:contextmenu|stopPropagation|preventDefault={() => null}
      >
        <Pane
          title={namesMap.get(runName)}
          actions={createActionsForRunningScript()}
          status={getRunStatus()}
          showExpendIcon={false}
          fixedActions={createFixedActions()}
        />
      </div>
    {/key}
  {/if}
</div>
<ContextMenu
  {hide}
  actions={status
    ? createActionsForContextMenu()
    : createActionsForContextMenu()}
  {pos}
/>

<style lang="postcss">
  .body {
    *:focus {
      /* background-color: var(--vscode-list-activeSelectionBackground); */
      outline-color: var(--vscode-list-focusHighlightForeground);
    }

    *:selection {
      background-color: var(--vscode-list-activeSelectionBackground);
    }
    text-overflow: ellipsis;
  }

  .running {
    position: relative;
    overflow: hidden;
  }

  .results {
    position: relative;
    overflow: hidden;
  }

  .renameInput {
    background-color: var(--vscode-editor-inactiveSelectionBackground);
    display: flex;
    flex-direction: row;
    align-items: flex-start;

    .icon {
      position: relative;
      left: 22px;
      top: 3px;
    }
    .input {
      display: flex;
      flex-direction: row;
      width: 90%;
      display: inline;
      overflow: hidden;
      border-width: 1px;
      border-style: solid;
      border-color: var(--vscode-inputValidation-infoBorder);
      background-color: var(--vscode-editor-inactiveSelectionBackground);
      color: var(--foreground);
      margin-left: 24px;
      margin-right: 0;
    }
    .input:focus {
    }
  }
</style>
