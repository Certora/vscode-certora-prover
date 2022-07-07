<script lang="ts">
  import { rename } from 'fs'

  import {
    Run,
    Verification,
    TreeType,
    Job,
    Rule,
    Assert,
    Action,
  } from '../types'
  import Pane from './Pane.svelte'
  import Tree from './Tree.svelte'

  export let doRename: boolean = true
  export let editFunc: () => void
  export let deleteFunc: () => void
  export let namesMap: Map<string, string>
  export let runName: string = ''
  export let renameRun: (oldName: string, newName: string) => void
  export let duplicateFunc: (toDuplicate: Run, duplicated: Run) => void
  export let runFunc: () => void
  export let verificationResults: Verification[]
  export let newFetchOutput: (
    e: CustomEvent<Assert | Rule>,
    vr: Verification,
  ) => void
  let initialExpandedState = true
  let doRun = true //todo: get this from extension
  let beforeRename = ''
  let activateRunRename = false
  const UNTITLED = 'untitled'

  function onKeyPress(e: any) {
    console.log('===somekey===')
    if (e.key === 'Enter') {
      doRename = false
      console.log('===enter===' + e.currentTarget.value)
      if (e.currentTarget.value === '') {
        runName = UNTITLED
        titleHandle()
      }
      activateRunRename = true
    }
  }

  /**
   * returns a name for a duplicated item
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

  function duplicate() {
    let toDuplicate = { name: runName }
    let duplicatedName = duplicateName()
    let duplicatedRun = { name: spacesToUnderscores(duplicatedName) }
    namesMap.set(spacesToUnderscores(duplicatedName), duplicatedName)
    duplicateFunc(toDuplicate, duplicatedRun)
  }

  function createActions(): Action[] {
    let actions: Action[] = [
      {
        title: 'rename',
        icon: 'edit',
        onClick: setRename,
      },
      {
        title: 'edit',
        icon: 'settings',
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
    if (doRun) {
      const runAction = {
        title: 'run',
        icon: 'run',
        onClick: runFunc,
      }
      actions.push(runAction)
    }
    return actions
  }

  function retrieveRules(jobs: Job[]): Rule[] {
    // rulesArrays = [Rule[] A, Rule[]B,...]
    const rulesArrays: Rule[][] = jobs.map(
      job => job.verificationProgress.rules,
    )
    return [].concat(...rulesArrays)
  }
</script>

<div class="newRun">
  {#if doRename}
    <input
      value={namesMap.get(runName) || ''}
      on:keypress={onKeyPress}
      on:change={onChange}
    />
  {:else}
    <div>
      <Pane
        title={namesMap.get(runName)}
        {initialExpandedState}
        actions={createActions()}
      >
        {#each verificationResults as vr (vr.contract + '-' + vr.spec)}
          {#if vr.name === runName}
            <Tree
              data={{
                type: TreeType.Rules,
                tree: retrieveRules(vr.jobs),
              }}
              on:fetchOutput={e => newFetchOutput(e, vr)}
            />
          {/if}
        {/each}
      </Pane>
    </div>
  {/if}
</div>
