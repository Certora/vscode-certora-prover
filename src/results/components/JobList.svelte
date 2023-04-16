<script lang="ts">
  import { onMount } from 'svelte'
  import { writable } from 'svelte/store'
  import {
    askToDeleteJob,
    deleteConf,
    duplicate,
    editConfFile,
    enableEdit,
    getOutput,
    initResults,
    openSettings,
    removeScript,
    rename,
    runScript,
    stopScript,
    uploadConf,
  } from '../extension-actions'
  import { expandables, jobLists, verificationResults } from '../store/store'
  import {
    Assert,
    CallTraceFunction,
    EventsFromExtension,
    EventTypesFromExtension,
    JobNameMap,
    Output,
    Rule,
    Run,
    Status,
    Verification,
  } from '../types'
  import { log, Sources } from '../utils/log'
  import { smartMergeVerificationResult } from '../utils/mergeResults'
  import NewRun from './NewRun.svelte'
  import Pane from './Pane.svelte'

  export let path
  export let title
  export let focusedRun
  export let children

  export let runs: Run[] = []
  $: runs ? console.log('runs===: ', runs) : console.log('no runs')
  export let namesMap: Map<string, string> = new Map()
  let runsCounter
  $: runs ? (runsCounter = runs.length) : (runsCounter = 0)
  // running / pending queues are binded and contains all jobs from all job lists that are pending / running
  export let runningScripts: {
    pid: number
    confFile: string
    uploaded: boolean
  }[] = []

  export let pendingQueue: JobNameMap[] = []
  let pendingQueueCounter = 0

  // bind output
  export let output: Output
  let outputRunName: string

  let selectedCalltraceFunction: CallTraceFunction

  export let level = 0

  export const hide = writable([])
  export const pos = writable({ x: 0, y: 0 })

  export const expandCollapse = writable({
    title: 'Expand All',
    icon: 'expand-all',
    var: true,
    hasResults: false,
  })

  $: $verificationResults.length
    ? ($expandCollapse.hasResults = true)
    : ($expandCollapse.hasResults = false)

  onMount(() => {
    window.addEventListener('message', listener)
    if (
      runs.length &&
      !$verificationResults.find(vr => {
        return vr.name === run.name
      })
    ) {
      initResults()
    }
  })

  const listener = (e: MessageEvent<EventsFromExtension>) => {
    switch (e.data.type) {
      case EventTypesFromExtension.ReceiveNewJobResult: {
        log({
          action: 'Smart merge current results with new result',
          source: Sources.ResultsWebview,
          info: {
            currentverificationResults: $verificationResults,
            newResult: e.data.payload,
            name: e.data.payload.runName,
            pid: e.data.payload.pid,
          },
        })
        const pid = e.data.payload.pid
        const vrName = e.data.payload.runName
        const run = runs.find(run => {
          return run.name === vrName
        })
        console.log('run?', run, 'runs;', runs)
        const runName = run?.name
        if (!run || !runName) return
        setVerificationReportLink(pid, e.data.payload.verificationReportLink)
        if (e.data.payload.jobStatus === 'FAILED') {
          setStoppedJobStatus(runName)
          return
        }
        smartMergeVerificationResult(
          $verificationResults,
          e.data.payload,
          runName,
        )
        $verificationResults = $verificationResults

        updateExpendablesFromResults()

        const thisRun = e.data.payload
        if (!thisRun.jobEnded) {
          runs = setStatus(runName, Status.incompleteResults)
        }

        if (thisRun.jobStatus === 'RUNNING' && thisRun.jobEnded) {
          runs = setStatus(runName, Status.success)
        }

        if (e.data.payload.jobStatus === 'SUCCEEDED') {
          if (runName) {
            removeScript(runName)
            // runs = setStatus(runName, Status.success)
            setStoppedJobStatus(runName)
          }
        }
        log({
          action: 'After Smart merge current results with new result',
          source: Sources.ResultsWebview,
          info: {
            updated$verificationResults: $verificationResults,
          },
        })
        break
      }
      case EventTypesFromExtension.ScriptStopped: {
        log({
          action: 'Received "script-stopped" command',
          source: Sources.ResultsWebview,
          info: e.data.payload,
        })
        const pid = e.data.payload
        const curRun = runs.find(run => run.id === pid)

        if (curRun !== undefined) {
          const runName = curRun.name
          if (
            curRun.status === Status.running ||
            curRun.status === Status.pending
          ) {
            runs = setStatus(runName, Status.ready)
          } else if (curRun.status === Status.incompleteResults) {
            setStoppedJobStatus(runName)
          }
        }

        runningScripts = runningScripts.filter(rs => {
          return rs.pid !== pid
        })
        break
      }
      case EventTypesFromExtension.AllowRun: {
        log({
          action: 'Received "allow-run" command',
          source: Sources.ResultsWebview,
          info: e.data.payload,
        })
        // status is changed to 'ready' when job is allowed to run
        const runName = e.data.payload
        let newStatus = Status.ready
        if (
          $verificationResults.find(vr => {
            return vr.name === getFileName(runName)
          })
        ) {
          newStatus = Status.success
        }
        runs = setStatus(runName, newStatus)
        break
      }
      case EventTypesFromExtension.BlockRun: {
        log({
          action: 'Received "block-run" command',
          source: Sources.ResultsWebview,
          info: e.data.payload,
        })
        // status is changed to 'finish setup' when job isn't allowed to run
        runs = setStatus(e.data.payload, Status.missingSettings)
        break
      }
      case EventTypesFromExtension.SettingsError: {
        log({
          action: 'Received "settings-error" command',
          source: Sources.ResultsWebview,
          info: e.data.payload,
        })
        // status is changed to 'finish setup' when job isn't allowed to run
        runs = setStatus(e.data.payload, Status.settingsError)
        break
      }
      //todo: clear results vs delete results?
      case EventTypesFromExtension.clearResults: {
        log({
          action: 'Received "clear-results" command',
          source: Sources.ResultsWebview,
          info: e.data.payload,
        })
        const name = getFileName(e.data.payload)
        $verificationResults = $verificationResults.filter(vr => {
          return vr.name !== name
        })
        runs = runs.map(run => {
          if (run.name === name) {
            run.status = Status.ready
          }
          return run
        })
        break
      }
      case EventTypesFromExtension.CreateJob: {
        log({
          action: 'Received "create-new-job" command',
          source: Sources.ResultsWebview,
        })
        createRun()
        break
      }
      case EventTypesFromExtension.ParseError: {
        log({
          action: 'Received "parse-error" command',
          source: Sources.ResultsWebview,
          info: e.data.payload,
        })
        const runName = e.data.payload
        runs = setStatus(runName, Status.unableToRun)
        break
      }
      case EventTypesFromExtension.RunJob: {
        log({
          action: 'Received "run-job" command',
          source: Sources.ResultsWebview,
          info: e.data.payload,
        })

        const path: string = e.data.payload
        const runToRun: Run = runs.find(r => {
          return r.confPath === path
        })
        if (runToRun !== undefined) {
          run(runToRun)
        }
        break
      }
      //   case EventTypesFromExtension.DeleteResults: {
      //     log({
      //       action: 'Received "delete-results" command',
      //       source: Sources.ResultsWebview,
      //       info: e.data.payload,
      //     })
      //     const nameToDelete = e.data.payload
      //     runs = runs.map(run => {
      //       if (run.name === nameToDelete) {
      //         run.status = Status.ready
      //       }
      //       return run
      //     })
      //     $verificationResults = $verificationResults.filter(vr => {
      //       return vr.name !== nameToDelete
      //     })
      //     break
      //   }
      case EventTypesFromExtension.RunningScriptChanged: {
        log({
          action: 'Received "running-scripts-changed" command',
          source: Sources.ResultsWebview,
          info: e.data.payload,
        })
        // runningScripts = e.data.payload
        runs = runs.map(r => {
          runningScripts.forEach(rs => {
            if (r.confPath === rs.confFile) {
              r.id = rs.pid
            }
          })
          return r
        })
        // if there is no running script - run next
        // if (!e.data.payload.length) {
        //   runNext()
        // }
        break
      }
      case EventTypesFromExtension.UploadingFiles: {
        log({
          action: 'Received "run-next" command',
          source: Sources.ResultsWebview,
          info: e.data.payload,
        })
        let confToEnable: JobNameMap = {
          displayName: '',
          confPath: '',
        }
        const curPid = e.data.payload.pid
        const vrLink = e.data.payload.vrLink
        runningScripts = runningScripts.map(rs => {
          if (rs.pid === curPid) {
            rs.uploaded = true
            confToEnable.confPath = rs.confFile
            confToEnable.displayName = namesMap.get(
              getFileName(confToEnable.confPath),
            )
            enableEdit(confToEnable)
          }
          return rs
        })
        runningScripts = runningScripts
        runs = runs.map(run => {
          if (run.id === curPid) {
            run.vrLink = vrLink
          }
          return run
        })
        // when we receive the results of the last run, we run the next job!
        // runNext()
        break
      }
      case EventTypesFromExtension.DeleteJob: {
        log({
          action: 'Received "delete-job" command',
          source: Sources.ResultsWebview,
          info: e.data.payload,
        })

        const nameToDelete: string = e.data.payload
        const runToDelete: Run = runs.find(r => {
          return r.confPath === nameToDelete
        })
        if (runToDelete !== undefined) {
          const jobNameMap: JobNameMap = {
            confPath: nameToDelete,
            displayName: namesMap.get(getFileName(nameToDelete)),
          }
          deleteRun(runToDelete)
          deleteConf(jobNameMap)
        }
        break
      }
      default:
        break
    }
  }

  /**
   * updated the results tree expand values according to results
   */
  function updateExpendablesFromResults() {
    $verificationResults.forEach(vr => {
      return vr.jobs.forEach(job => {
        const temp = job.verificationProgress.rules.map(rule => {
          return {
            title: rule.name,
            isExpanded: false,
            tree: [],
          }
        })
        $expandables = $expandables.map(element => {
          if (
            element.title === namesMap.get(job.runName) &&
            !element.tree.length
          ) {
            element.tree = temp
          }
          return element
        })
      })
    })
  }

  /**
   * when a job was cancel from outside sources
   * @param jobName the name of the job that was canceled
   */
  function setStoppedJobStatus(jobName: string): void {
    if (jobName) {
      removeScript(jobName)
      if (
        !$verificationResults.length ||
        !$verificationResults.map(vr => {
          return vr.name === jobName
        })
      ) {
        runs = setStatus(jobName, Status.unableToRun)
        return
      }
      $verificationResults.forEach(vr => {
        if (vr.name === jobName) {
          runs = setStatus(jobName, Status.success)
        } else if (
          runs.find(run => {
            return run.name === jobName
          })?.status === Status.running
        ) {
          runs = setStatus(jobName, Status.unableToRun)
        }
      })
      $verificationResults = $verificationResults
      return
    }
  }

  /**
   * stops a pending run
   */
  function pendingStopFunc(run: Run): void {
    pendingQueue = pendingQueue.filter(rq => {
      return rq.confPath !== run.confPath
    })
    $verificationResults = $verificationResults.filter(vr => {
      return vr.name !== run.name
    })
    pendingQueueCounter--
    runs = setStatus(run.confPath, Status.ready)
  }

  /**
   * set the status of the run named [runName] to be [value]
   * @param runConfPath name of a run
   * @param value status
   * @returns new list of runs after change
   */
  function setStatus(runConfPath: string, value: Status): Run[] {
    runs.forEach(run => {
      if (
        (run.confPath === runConfPath || run.name === runConfPath) &&
        !(run.status === Status.success && value === Status.ready)
      ) {
        run.status = value
      }
    })
    return runs
  }

  /**
   * run all the runs that are allowed to run
   */
  function runAll(): void {
    const jobsToRun = runs.filter(singleRun => {
      return singleRun.status === Status.ready
    })
    jobsToRun.forEach((job, index) => {
      run(job, index)
    })
  }

  /**
   * set vrLink of the run with name [runName] to [link]
   * @param runName name of the run to update
   * @param link to verification report of run [runName]
   */
  function setVerificationReportLink(pid: number, link: string) {
    runs.forEach(run => {
      if (run.id === pid) {
        run.vrLink = link
      }
    })
    runs = runs
  }

  /**
   * adds a new run to runs array and increase the counter
   * @param run new run. if doest exists - creates a new run object
   */
  function createRun(run?: Run): void {
    $hide.push(true)
    if (run) {
      if (!run.status) {
        run.status = Status.missingSettings
      }
      runsCounter = runs.push(run)
      addNewExpendable(namesMap.get(run.name))
    } else {
      // don't create more than one new run while in rename state
      if (runs.find(r => r.name === '')) return
      runsCounter = runs.push({
        id: runs.length,
        name: '',
        confPath: '',
        status: Status.missingSettings,
      })
      addNewExpendable('')
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
   * operates the expand / collapse functionality
   */
  function expandCollapseAll() {
    // if ($expandCollapse.hasResults) {
    $expandables = $expandables.map(element => {
      if (element.title === title) {
        //   element.isExpanded = $expandCollapse.var
        // }
        element.tree = element.tree.map(treeItem => {
          treeItem.isExpanded = $expandCollapse.var
          return treeItem
        })
      }
      return element
    })
    $expandCollapse.title = $expandCollapse.var ? 'Collapse All' : 'Expand All'
    $expandCollapse.icon = $expandCollapse.var ? 'collapse-all' : 'expand-all'
    $expandCollapse.var = !$expandCollapse.var
    // }
  }

  function resentHide() {
    $hide = $hide.map(item => {
      return (item = true)
    })
  }

  function showMenu(e, index) {
    $pos = { x: e.clientX, y: e.pageY }
    resentHide()
    $hide[index] = false
  }

  function editRun(run: Run): void {
    const jobNameMap: JobNameMap = {
      confPath: run.confPath,
      displayName: namesMap.get(run.name),
    }
    editConfFile(jobNameMap)
  }

  /**
   * ask to delete the job "run"
   * @param run the job to delete
   */
  function askToDeleteThis(run: Run): void {
    const jobNameMap: JobNameMap = {
      confPath: run.confPath,
      displayName: namesMap.get(run.name),
    }
    askToDeleteJob(jobNameMap)
  }

  /**
   * deletes a run and it's results
   * @param runToDelete run to delete
   */
  function deleteRun(runToDelete: Run): void {
    const name = runToDelete.name

    //delete results
    $verificationResults = $verificationResults.filter(vr => {
      return vr.name !== name
    })

    //delete from running scripts
    runningScripts = runningScripts.filter(rs => {
      return rs.confFile !== name
    })

    //delete run
    runs = runs.filter(run => {
      return run !== runToDelete
    })
    namesMap.delete(name)

    if (output && output.runName === name) {
      clearOutput()
    }

    runsCounter--
  }

  function clearOutput() {
    if (output) output = undefined
    if (selectedCalltraceFunction) selectedCalltraceFunction = undefined
  }

  /**
   * rename the run named oldName to newName (also renames the conf file)
   * @param oldName name to change
   * @param newName new name for the run and conf
   */
  function renameRun(oldName: string, newName: string): void {
    // rename existing run
    if (oldName) {
      // the renamed run should have the same verification results, if they exist
      let oldResult = $verificationResults.find(vr => vr.name === oldName)
      if (oldResult) {
        let newResult: Verification = {
          name: newName,
          contract: oldResult.contract,
          spec: oldResult.spec,
          jobs: oldResult.jobs,
        }
        $verificationResults = $verificationResults.filter(vr => {
          return vr.name !== oldName
        })
        $verificationResults.push(newResult)
      }

      const curRun = runs.find(singleRun => {
        return singleRun.name === newName
      })

      // new path creation
      const newPathArr = curRun.confPath.split('/')
      newPathArr[newPathArr.length - 1] = newPathArr[
        newPathArr.length - 1
      ].replace(oldName, newName)
      const newPath = newPathArr.join('/')

      const oldConfNameMap: JobNameMap = {
        confPath: curRun.confPath,
        displayName: namesMap.get(oldName),
      }
      const newConfNameMap: JobNameMap = {
        confPath: newPath,
        displayName: namesMap.get(newName),
      }
      rename(oldConfNameMap, newConfNameMap)
      namesMap.delete(oldName)
    }
    // rename new run
    else {
      const JobNameMap: JobNameMap = {
        confPath: newName,
        displayName: namesMap.get(newName),
      }
      openSettings(JobNameMap)
    }
    focusedRun = newName
  }

  /**
   * duplicate [name to duplicate] into [duplicatedName]
   * this will create a new run and a new conf file with a duplicated name
   * @param nameToDuplicate
   * @param duplicatedName
   */
  function duplicateRun(
    nameToDuplicate: string,
    duplicatedName: string,
    rule?: string,
  ): void {
    const toDuplicate: Run = runs.find(run => run.name === nameToDuplicate)

    // the status of the new run cannot be 'success' (haven't run yet => no results)
    let newStatus = toDuplicate.status
    if (newStatus === Status.success) {
      newStatus = Status.ready
    }

    // old path recreation
    const newPathArr = toDuplicate.confPath.split('/')
    newPathArr[newPathArr.length - 1] = newPathArr[
      newPathArr.length - 1
    ].replace(nameToDuplicate, duplicatedName)
    const newPath = newPathArr.join('/')

    const duplicated: Run = {
      id: runs.length,
      name: duplicatedName,
      confPath: newPath,
      status: newStatus,
    }

    const confNameMapDuplicated: JobNameMap = {
      confPath: duplicated.confPath,
      displayName: namesMap.get(duplicated.name),
    }

    const confNameMapToDuplicate: JobNameMap = {
      confPath: toDuplicate.confPath,
      displayName: namesMap.get(toDuplicate.name),
    }
    duplicate(confNameMapToDuplicate, confNameMapDuplicated, rule)
    createRun(duplicated)
    if (!rule) {
      focusedRun = duplicatedName
    }
  }

  function newFetchOutput(e: CustomEvent<Assert | Rule>, vr: Verification) {
    let clickedRuleOrAssert = e.detail

    const index = vr.jobs.findIndex(
      job => job.jobId === clickedRuleOrAssert.jobId,
    )

    if (index > -1) {
      // type of Rule.output / Assert.output is going to be changed to string[] in a new version
      // of certora prover. support both new & old versions:
      let curOutput: string | null = null
      if (typeof clickedRuleOrAssert.output === 'string') {
        curOutput = clickedRuleOrAssert.output
      } else if (
        clickedRuleOrAssert.output &&
        clickedRuleOrAssert.output.length
      ) {
        curOutput = clickedRuleOrAssert.output[0]
      }
      const outputUrl = `${vr.jobs[index].progressUrl.replace(
        'progress',
        'result',
      )}&output=${clickedRuleOrAssert.output}`
      getOutput(outputUrl)
      outputRunName = vr.name
    } else {
      console.log(
        'Error occurred while fetching the output - job id is  undefined',
      )
    }
  }

  /**
   * either run this run or add to pending queue
   * @param run run to run
   * @param index if 0 - run, else: add to pending queue
   */
  function run(run: Run, index = 0): void {
    run.vrLink = ''
    const JobNameMap: JobNameMap = {
      confPath: run.confPath,
      displayName: namesMap.get(run.name),
    }

    //add to pending queue
    pendingQueue.push(JobNameMap)
    runs = setStatus(JobNameMap.confPath, Status.pending)
    pendingQueueCounter++
    $verificationResults = $verificationResults.filter(vr => {
      return vr.name !== getFileName(JobNameMap.confPath)
    })

    if (output && output.runName === run.name) {
      clearOutput()
    }

    const shouldRunNext = runningScripts.every(rs => {
      return rs.uploaded === true
    })
    //if there are no running scripts => runNext
    if ((!runningScripts.length || shouldRunNext) && index === 0) {
      runNext()
    }
  }

  /**
   * run the first pending run in the queue
   */
  function runNext(): void {
    if (pendingQueue.length) {
      let curRun = pendingQueue.shift()
      pendingQueueCounter--
      $verificationResults = $verificationResults.filter(vr => {
        return vr.name !== getFileName(curRun.confPath)
      })
      runScript(curRun)
    }
  }

  /**
   * from conf file uri to only the file name
   */
  function getFileName(confFile: string): string {
    return confFile.split('/').pop().replace('.conf', '')
  }

  function createActions() {
    if (runsCounter) {
      return [
        {
          title: 'Run All',
          icon: 'run-all',
          onClick: runAll,
          disabled: runs.length === 0,
        },
        {
          title: 'Create New Job From Existing File',
          icon: 'new-file',
          onClick: uploadConf,
        },
        {
          title: 'Create New Job',
          icon: 'diff-added',
          onClick: createRun,
        },
        {
          title: $expandCollapse.title,
          icon: $expandCollapse.icon,
          onClick: expandCollapseAll,
          disabled:
            $verificationResults.find(vr => {
              return vr.name === title
            }) !== undefined,
        },
      ]
    }
    return []
  }
</script>

<div>
  <div style="margin-left:{level}px;">
    <Pane {title} fixedActions={createActions()}>
      <ul class="running-scripts">
        {#each Array(runsCounter) as _, index (index)}
          <li
            on:contextmenu|stopPropagation|preventDefault={e => {
              showMenu(e, index)
            }}
          >
            <NewRun
              pathToConf={runs[index].confPath}
              editFunc={() => editRun(runs[index])}
              deleteFunc={() => askToDeleteThis(runs[index])}
              deleteRun={() => deleteRun(runs[index])}
              {namesMap}
              {renameRun}
              duplicateFunc={duplicateRun}
              runFunc={() => run(runs[index])}
              status={runs[index].status}
              {newFetchOutput}
              nowRunning={(runningScripts.find(
                rs => rs.confFile === runs[index].confPath,
              ) !== undefined ||
                (pendingQueue.find(
                  rs => rs.confPath === runs[index].confPath,
                ) !== undefined &&
                  pendingQueueCounter > 0)) &&
                $verificationResults.find(
                  vr => runs[index].name === vr.name,
                ) === undefined}
              isPending={pendingQueue.find(
                rs => rs.confPath === runs[index].confPath,
              ) !== undefined && pendingQueueCounter > 0}
              expandedState={$verificationResults.find(
                vr => vr.name === runs[index].name,
              ) !== undefined}
              pendingStopFunc={() => {
                pendingStopFunc(runs[index])
              }}
              runningStopFunc={() => {
                enableEdit({
                  confPath: runs[index].confPath,
                  displayName: namesMap.get(runs[index].name),
                })
                runs[index].vrLink = ''
                const modal = runs[index].status !== Status.running
                stopScript(runs[index].id, modal)
              }}
              inactiveSelected={focusedRun}
              {setStatus}
              vrLink={runs[index].vrLink}
              hide={$hide[index]}
              pos={$pos}
              bind:runName={runs[index].name}
            />
          </li>
        {/each}
      </ul>
      {#each children as child, index}
        <svelte:self
          path={child.path}
          title={child.title}
          runs={child.runs}
          namesMap={child.namesMap}
          children={child.children}
          level={level + 10}
          bind:focusedRun
          bind:output
          bind:runningScripts
          bind:pendingQueue
        />
      {/each}
    </Pane>
  </div>
</div>

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

  .running-scripts {
    padding: 0;
    margin: 0;
    list-style-type: none;
  }
</style>
