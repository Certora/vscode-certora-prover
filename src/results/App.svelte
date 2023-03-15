<script lang="ts">
  /* ---------------------------------------------------------------------------------------------
   *  Main file of the Results part of the extension.
   *  creates runs under MY RUNS pane, creates action buttons, sends actions
   *  like edit, run etc.
   *-------------------------------------------------------------------------------------------- */

  import { onMount, onDestroy } from 'svelte'
  // import Pane from './components/Pane.svelte'
  // import CodeItemList from './components/CodeItemList.svelte'
  // import Tree from './components/Tree.svelte'
  // import ContractCallResolution from './components/ContractCallResolution.svelte'
  import {
    // runScript,
    // stopScript,
    // openSettings,
    // getOutput,
    // editConfFile,
    // deleteConf,
    // duplicate,
    // removeScript,
    // askToDeleteJob,
    initResults,
    uploadConf,
    // enableEdit,
    // rename,
  } from './extension-actions'
  // import { smartMergeVerificationResult } from './utils/mergeResults'
  import { log, Sources } from './utils/log'
  import {
    // Assert,
    Output,
    EventsFromExtension,
    // Rule,
    // Verification,
    Run,
    // JobNameMap,
    Status,
    // CONF_DIRECTORY,
    // RuleStatuses,
  } from './types'
  import { TreeType, CallTraceFunction, EventTypesFromExtension } from './types'
  // import NewRun from './components/NewRun.svelte'

  import { writable } from 'svelte/store'
  import {
    expandables,
    expandCollapse,
    verificationResults,
    jobLists,
  } from './store/store'
  import JobList from './components/JobList.svelte'

  // export const hide = writable([])
  // export const pos = writable({ x: 0, y: 0 })
  // export const focusedRun = writable('')

  // let output: Output
  // let outputRunName: string
  // let selectedCalltraceFunction: CallTraceFunction

  // let runningScripts: { pid: number; confFile: string; uploaded: boolean }[] =
  //   []
  let runs: Run[] = []
  // let pendingQueue: JobNameMap[] = []
  // let pendingQueueCounter = 0
  let namesMap: Map<string, string> = new Map()
  let runsCounter = 0

  let jobListCounter = 0

  $: $jobLists.length > 0
    ? (jobListCounter = $jobLists.length)
    : (jobListCounter = 0)

  // listen to the results array to see if there are results or not
  $: $verificationResults.length > 0
    ? ($expandCollapse.hasResults = true)
    : ($expandCollapse.hasResults = false)

  const listener = (e: MessageEvent<EventsFromExtension>) => {
    switch (e.data.type) {
      case EventTypesFromExtension.InitialJobs: {
        log({
          action: 'Received "initial-jobs" command',
          source: Sources.ResultsWebview,
          info: e.data.payload,
        })
        console.log('payload:', e.data.payload)
        const confList = e.data.payload
        const curJobList = $jobLists.find(jl => {
          return jl.dirPath.path === confList.dirPath.path
        })
        if (!curJobList) {
          $jobLists.push(confList)
          $jobLists = $jobLists
          jobListCounter++
        } else {
          $jobLists = $jobLists.map(jl => {
            if (jl.dirPath === curJobList.dirPath) {
              confList.jobs.forEach(job => {
                jl.jobs.push(job)
              })
            }
            return jl
          })
        }
        break
      }

      default:
        break
    }
  }

  function addNewExpendable(title: string) {
    $expandables = [
      ...$expandables,
      {
        title: title,
        isExpanded: true,
        tree: [],
      },
    ]
  }

  /**
   * adds a new run to runs array and increase the counter
   * @param run new run. if doest exists - creates a new run object
   */
  function createRun(run?: Run): void {
    // $hide.push(true)
    // if (run) {
    //   if (!run.status) {
    //     run.status = Status.missingSettings
    //   }
    //   runsCounter = runs.push(run)
    //   addNewExpendable(namesMap.get(run.name))
    // } else {
    // don't create more than one new run while in rename state
    // if (runs.find(r => r.name === '')) return
    jobListCounter = $jobLists.push({
      title: 'JOB LIST',
      jobs: [
        {
          id: runs.length,
          name: {
            fileName: '',
            displayName: '',
            jobListPath: null,
          },
          status: Status.missingSettings,
        },
      ],
    })
    addNewExpendable('')
    // }
  }

  onMount(() => {
    window.addEventListener('message', listener)
    // $expandables.push({
    //   title: 'JOB LIST',
    //   isExpanded: true,
    //   tree: [],
    // })
    if (jobListCounter === 0) {
      initResults()
    }
  })

  onDestroy(() => {
    window.removeEventListener('message', listener)
  })
</script>

{#if jobListCounter === 0}
  <div class="zero-state">
    <div class="command">
      <h3 class="command-description">Welcome To Certora Prover IDE</h3>
      <div class="command-description">Verify your smart contract</div>
    </div>
  </div>

  <div class="zero-state">
    <div class="command">
      <div class="command-description">Create your first job</div>
      <vscode-button class="command-button" on:click={() => createRun()}>
        Configure New Job
      </vscode-button>
      <div class="command-description">Or</div>
      <vscode-button class="command-button" on:click={() => uploadConf()}>
        Upload Configuration File
      </vscode-button>
    </div>
  </div>
{:else}
  {#each $jobLists as jobList}
    {#key [jobListCounter]}
      <JobList {jobList} />
    {/key}
  {/each}
{/if}

<style lang="postcss">
  :global(body) {
    padding: 0;
  }

  :global(:root) {
    --monospace-font: consolas, menlo, 'Courier New', monospace;
  }

  :global(body.vscode-light) {
    --code-item-name-color: #00f;
    --code-item-value-color: #454545;
    --code-item-value-background-color: #e4e6f1;
    --code-item-background-color-selected: #0060c0;
    --code-item-background-color-hover: #e4e6f1;
    --pane-border-color: rgb(97 97 97 / 19%);
  }

  :global(body.vscode-dark) {
    --code-item-name-color: #7cb9eb;
    --code-item-value-color: #ccc;
    --code-item-value-background-color: #37373d;
    --code-item-background-color-selected: #094771;
    --code-item-background-color-hover: #37373d;
    --pane-border-color: rgb(204 204 204 / 20%);
  }

  .zero-state {
    padding: 0 8px 0 20px;

    .command {
      margin-bottom: 27px;
    }

    .command-description {
      margin-bottom: 10px;
      line-height: 16px;
    }
    .command-button {
      width: 230px;
      height: 30px;
      margin-bottom: 10px;
      line-height: 16px;
      display: flex;
      justify-content: center;
      align-items: center;
    }
  }

  .running-scripts {
    padding: 0;
    margin: 0;
    list-style-type: none;
  }
</style>
