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
    enableEdit,
    runScript,
    // rename,
  } from './extension-actions'
  // import { smartMergeVerificationResult } from './utils/mergeResults'
  import { log, Sources } from './utils/log'
  import {
    // Assert,
    // Output,
    EventsFromExtension,
    // Rule,
    // Verification,
    Run,
    JobNameMap,
    Status,
    // CONF_DIRECTORY,
    // RuleStatuses,
  } from './types'
  import { TreeType, CallTraceFunction, EventTypesFromExtension } from './types'
  // import NewRun from './components/NewRun.svelte'

  import { Writable, writable } from 'svelte/store'
  import {
    expandables,
    expandCollapse,
    verificationResults,
    jobLists,
  } from './store/store'
  import JobList from './components/JobList.svelte'
  import type { Uri } from 'vscode'

  // export const hide = writable([])
  // export const pos = writable({ x: 0, y: 0 })
  // export const focusedRun = writable('')

  // let output: Output
  // let outputRunName: string
  // let selectedCalltraceFunction: CallTraceFunction

  let runningScripts: Writable<
    { pid: number; confFile: string; uploaded: boolean }[]
  > = writable([])
  // let runs: Run[] = []
  let pendingQueue: Writable<JobNameMap[]> = writable([])
  let pendingQueueCounter = 0
  // let namesMap: Map<string, string> = new Map()
  // let runsCounter = 0

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
          addNewExpendable(confList.title, confList.dirPath)
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
      case EventTypesFromExtension.UploadingFiles: {
        log({
          action: 'Received "run-next" command',
          source: Sources.ResultsWebview,
          info: e.data.payload,
        })

        const curPid = e.data.payload.pid
        const vrLink = e.data.payload.vrLink

        $runningScripts = $runningScripts.map(rs => {
          if (rs.pid === curPid) {
            rs.uploaded = true
            //todo: handle enable edit
            // enableEdit(confToEnable)
          }
          return rs
        })
        $runningScripts = $runningScripts
        $jobLists = $jobLists.map(jl => {
          $runningScripts.forEach(rs => {
            const urlArr = rs.confFile.split('/')
            const confName = urlArr[urlArr.length - 1].replace('.conf', '')
            const uriPath = urlArr.slice(0, urlArr.length - 1).join('/') + '/'
            console.log(confName, uriPath, 'OMG')
            console.log(jl.dirPath.path, 'OMG1')

            if (uriPath === jl.dirPath.path) {
              jl.jobs = jl.jobs.map(job => {
                console.log(job.name.fileName, jl.dirPath.path, 'OMG2')
                if (confName === job.name.fileName) {
                  job.vrLink = vrLink
                }
                return job
              })
            }
          })
          return jl
        })
        // runs = runs.map(run => {
        //   if (run.id === curPid) {
        //     run.vrLink = vrLink
        //   }
        //   return run
        // })
        // when we receive the results of the last run, we run the next job!
        runNext()
        break
      }
      case EventTypesFromExtension.RunningScriptChanged: {
        log({
          action: 'Received "running-scripts-changed" command',
          source: Sources.ResultsWebview,
          info: e.data.payload,
        })
        // conf file is a full path to a conf file now
        $runningScripts = e.data.payload

        console.log('jobList before change of pid', $jobLists)
        $jobLists = $jobLists.map(jl => {
          $runningScripts.forEach(rs => {
            const urlArr = rs.confFile.split('/')
            const confName = urlArr[urlArr.length - 1].replace('.conf', '')
            const uriPath = urlArr.slice(0, urlArr.length - 1).join('/') + '/'
            console.log(confName, uriPath, 'OMG!')
            console.log(jl.dirPath.path, 'OMG1!')

            if (uriPath === jl.dirPath.path) {
              jl.jobs = jl.jobs.map(job => {
                console.log(job.name.fileName, jl.dirPath.path, 'OMG2!')
                if (confName === job.name.fileName) {
                  job.id = rs.pid
                }
                return job
              })
            }
          })
          return jl
        })
        console.log('jobList after change of pid', $jobLists)

        // if there is no running script - run next
        if (e.data.payload.length === 0) {
          runNext()
        }
        break
      }
      // case EventTypesFromExtension.ScriptStopped: {
      //   log({
      //     action: 'Received "script-stopped" command',
      //     source: Sources.ResultsWebview,
      //     info: e.data.payload,
      //   })
      //   const pid = e.data.payload
      //   const curRun = runs.find(run => run.id === pid)

      //   if (curRun !== undefined) {
      //     const runName = curRun.name
      //     setStoppedJobStatus(runName.fileName)
      //   }

      //   runningScripts = runningScripts.filter(rs => {
      //     return rs.pid !== pid
      //   })
      //   break
      // }
      default:
        break
    }
  }

  /**
   * from conf file uri to only the file name
   */
  //  function getFileName(confFile: string): string {
  //   return confFile.replace(CONF_DIRECTORY, '').replace('.conf', '')
  // }

  // function findJobInJobLists(fileName: string, uri: Uri) {
  //   const jobList = $jobLists.find(jl => {return jl.dirPath === uri})
  //   if (jobList) {
  //     return jobList.jobs.find(job => {return job.name.fileName === fileName})
  //   }
  // }

  /**
   * run the first pending run in the queue
   */
  function runNext(): void {
    console.log(
      'running scripts + pending queue from run next',
      $runningScripts,
      $pendingQueue,
    )
    const nonUploads = $runningScripts.filter(rs => {
      return rs.uploaded === false
    })
    if ($pendingQueue.length > 0 && nonUploads.length === 0) {
      let curRun = $pendingQueue.shift()
      // pendingQueueCounter--
      $verificationResults = $verificationResults.filter(vr => {
        return vr.name !== curRun.fileName
      })
      $jobLists = $jobLists.map(jl => {
        jl.jobs.forEach(job => {
          if (
            job.name.fileName === curRun.fileName &&
            job.name.jobListPath === curRun.jobListPath
          ) {
            job.status = Status.running
          }
        })
        return jl
      })
      $jobLists = $jobLists
      // runs = setStatus(curRun.fileName, Status.running)
      // jobList.jobs = runs
      runScript(curRun)
    }
  }

  function addNewExpendable(title: string, jobListPath: Uri) {
    $expandables = [
      ...$expandables,
      {
        title: title,
        jobListPath: jobListPath,
        isExpanded: true,
        tree: [],
        isJobList: true,
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
          id: 0,
          name: {
            fileName: '',
            displayName: '',
            jobListPath: null,
          },
          status: Status.missingSettings,
        },
      ],
    })
    addNewExpendable('JOB LIST', null)
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
      <JobList
        bind:jobList
        bind:pendingQueue={$pendingQueue}
        bind:runningScripts={$runningScripts}
        {runNext}
      />
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
