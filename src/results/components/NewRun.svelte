<script lang="ts">
  import { onDestroy, onMount } from 'svelte'

  import {
    Verification,
    TreeType,
    Job,
    Rule,
    Assert,
    Action,
    Status,
    EventsFromExtension,
    EventTypesFromExtension,
  } from '../types'
  import { log, Sources } from '../utils/log'
  import Pane from './Pane.svelte'
  import Tree from './Tree.svelte'

  export let doRename: boolean = true
  export let editFunc: () => void
  export let deleteFunc: () => void
  export let namesMap: Map<string, string>
  export let runName: string = ''
  export let renameRun: (oldName: string, newName: string) => void
  export let duplicateFunc: (
    nameToDuplicate: string,
    duplicatedName: string,
  ) => void
  export let runFunc: () => void
  export let verificationResults: Verification[]
  export let newFetchOutput: (
    e: CustomEvent<Assert | Rule>,
    vr: Verification,
  ) => void

  export let expandedState = false
  export let nowRunning = false

  export let doRun = false
  export let isPending = false

  export let pendingStopFunc: () => void
  export let runningStopFunc: () => void

  export let inactiveSelected: string = ''

  export let setDoRun: () => void

  const STATUS: Status = {
    finishSetup: 'Finish setup',
    ready: 'Ready',
    running: 'Running',
    pending: 'Pending',
    success: 'Ready success',
    unableToRun: 'Unable to run',
  }

  let beforeRename = ''
  let activateRunRename = false
  let status = STATUS.finishSetup

  const UNTITLED = 'untitled'

  const listener = (e: MessageEvent<EventsFromExtension>) => {
    switch (e.data.type) {
      case EventTypesFromExtension.ParseError: {
        log({
          action: 'Received "parse-error" command',
          source: Sources.ResultsWebview,
          info: e.data.payload,
        })
        if (e.data.payload === runName) {
          // editFunc()
          setDoRun()
          status = STATUS.unableToRun
          console.log('status: ', status)
        }
        break
      }
    }
  }

  onMount(() => {
    window.addEventListener('message', listener)
    if (doRun) {
      console.log('status changed from actions: ', status)
      status = STATUS.ready
    }
  })

  onDestroy(() => {
    window.removeEventListener('message', listener)
  })

  function onKeyPress(e: any) {
    console.log('===somekey===')
    if (e.key === 'Enter') {
      doRename = false
      console.log('===enter===' + e.currentTarget.value)
      if (e.currentTarget.value === '') {
        runName = UNTITLED
        titleHandle()
        renameRun('', spacesToUnderscores(runName))
      }
      activateRunRename = true
    }
  }

  /**
   * returns a name for a duplicated item
   * example: name => name (1)
   */
  function duplicateName() {
    let nameToDuplicate = runName
    if (namesMap.has(runName)) {
      nameToDuplicate = namesMap.get(runName)
    }
    let counter = 1
    let currentName = renameDuplicate(nameToDuplicate, counter)
    while (namesMap.has(spacesToUnderscores(currentName))) {
      counter++
      currentName = renameDuplicate(nameToDuplicate, counter)
      console.log('===while===')
    }
    return currentName
  }

  /**
   * process a title so it can become a suitable run name
   * a run name cannot contain spaces in the beginning/end of the name,
   * cannot have multiple spaces in a row, cannot contain special cheracters
   * outside space.
   * run name that only contains illegal characters and spaces will become 'undtitled'
   */
  function titleHandle() {
    runName = runName
      .replace(/[^a-zA-Z0-9 ]/g, '')
      .replace(/ +/g, ' ')
      .trim()
    if (runName === '') {
      runName = UNTITLED
    }
    if (namesMap.has(spacesToUnderscores(runName))) {
      console.log('===already been===')
      runName = duplicateName()
    }
    console.log('===new name===')
    namesMap.set(spacesToUnderscores(runName), runName)
    runName = spacesToUnderscores(runName)
    console.log(namesMap)
  }

  function renameDuplicate(name: string, counter: number) {
    return name + ' (' + counter.toString() + ')'
  }

  function spacesToUnderscores(name: string) {
    return name.replaceAll(' ', '_').toLocaleLowerCase()
  }

  function onChange(
    e: Event & {
      currentTarget: EventTarget & HTMLInputElement
    },
  ) {
    runName = e.currentTarget.value
    titleHandle()
    if (activateRunRename) {
      activateRunRename = false
      console.log('###old name: ', beforeRename, '###namesMap: ', namesMap)
      renameRun(beforeRename, spacesToUnderscores(runName))
    }
  }

  function setRename() {
    console.log('===rename===')
    doRename = true
    beforeRename = runName
  }

  function getRunStatus() {
    if (isPending) {
      status = STATUS.pending
    } else if (nowRunning) {
      status = STATUS.running
    }
    return status
  }

  function duplicate() {
    let duplicatedName = duplicateName()
    namesMap.set(spacesToUnderscores(duplicatedName), duplicatedName)
    duplicateFunc(runName, spacesToUnderscores(duplicatedName))
  }

  /**
   * creates actions for the finishSetup, ready and unableToRun statuses.
   * the actions are: rename, edit, delete, duplicate, and if possible: run
   */
  function createActions(): Action[] {
    let actions: Action[] = [
      {
        title: 'rename',
        icon: 'edit',
        onClick: setRename,
      },
      {
        title: 'edit',
        icon: 'gear',
        onClick: editFunc,
      },
      {
        title: 'delete',
        icon: 'trash',
        onClick: deleteFunc,
      },
      {
        title: 'duplicate',
        icon: 'add',
        onClick: duplicate,
      },
    ]
    // if (doRun) {
    //   console.log('status changed from actions: ', status)
    //   status = STATUS.ready
    // }
    return actions
  }

  function createActionsForRunningScript(): Action[] {
    if (isPending) {
      return [
        {
          title: 'stop',
          icon: 'stop-circle',
          onClick: pendingStopFunc,
        },
      ]
    }
    if (nowRunning) {
      return [
        {
          title: 'stop',
          icon: 'stop-circle',
          onClick: runningStopFunc,
        },
      ]
    }
    return []
  }

  function hasResults(): boolean {
    const result = verificationResults.find(vr => {
      return vr.name === runName
    })
    return result !== undefined
  }

  // was copied from App.svelte
  function retrieveRules(jobs: Job[]): Rule[] {
    // rulesArrays = [Rule[] A, Rule[]B,...]
    const rulesArrays: Rule[][] = jobs.map(
      job => job.verificationProgress.rules,
    )
    return [].concat(...rulesArrays)
  }
</script>

<div class="body">
  {#if doRename}
    <input
      class="input"
      value={namesMap.get(runName) || ''}
      placeholder="Enter run name"
      on:keypress={onKeyPress}
      on:change={onChange}
    />
  {:else if !nowRunning}
    <div class="results">
      <Pane
        title={namesMap.get(runName)}
        initialExpandedState={expandedState}
        actions={createActions()}
        showExpendIcon={expandedState}
        status={hasResults() ? STATUS.success : status}
        inactiveSelected={runName === inactiveSelected}
        runFunc={doRun ? runFunc : null}
      >
        {#each verificationResults as vr, index (index)}
          {#if vr.name === runName}
            <li class="tree">
              <Tree
                data={{
                  type: TreeType.Rules,
                  tree: retrieveRules(vr.jobs),
                }}
                on:fetchOutput={e => newFetchOutput(e, vr)}
              />
            </li>
          {/if}
        {/each}
      </Pane>
    </div>
  {:else}
    <div class="running">
      <Pane
        title={namesMap.get(runName)}
        initialExpandedState={false}
        actions={createActionsForRunningScript()}
        status={getRunStatus()}
        showExpendIcon={false}
      />
    </div>
  {/if}
</div>

<style lang="postcss">
  .body {
    *:focus {
      background-color: var(--vscode-list-activeSelectionBackground);
      outline-color: var(--vscode-list-focusHighlightForeground);
    }

    *:selection {
      background-color: var(--vscode-list-activeSelectionBackground);
    }
  }

  .running {
    position: relative;
    overflow: hidden;
  }

  .results {
    position: relative;
    overflow: hidden;
  }

  .input {
    width: 97.5%;
    border-width: 1px;
    border-style: solid;
    border-color: var(--vscode-inputValidation-infoBorder);
    background-color: var(--list-active-selection-background);
    color: white;
  }
</style>
