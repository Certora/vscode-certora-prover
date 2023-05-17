<script lang="ts">
  import { onMount } from 'svelte'
  import { writable } from 'svelte/store'
  import {
    UploadDir,
    askToDeleteJob,
    duplicate,
    editConfFile,
    enableEdit,
    getOutput,
    openSettings,
    removeScript,
    rename,
    runScript,
    stopScript,
    uploadConf,
  } from '../extension-actions'
  import { CERTORA_CONF, JOB_LIST, verificationResults } from '../store/store'
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
  export let isExpanded

  export let resetHide

  export let runs: Run[] = []
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
  export let outputRunName: string

  let selectedCalltraceFunction: CallTraceFunction

  export const pos = writable({ x: 0, y: 0 })

  const EXPAND_TITLE = 'Expand All'
  const EXPAND_ICON = 'expand-all'
  const COLLAPSE_TITLE = 'Collapse All'
  const COLLAPSE_ICON = 'collapse-all'

  export const expandCollapse = writable({
    title: COLLAPSE_TITLE,
    icon: COLLAPSE_ICON,
  })

  $: children.every(child => {
    return child.isExpanded
  }) &&
  runs.every(run => {
    return run.isExpanded
  })
    ? setExpandCollapse(COLLAPSE_TITLE, COLLAPSE_ICON)
    : null
  $: children.every(child => {
    return !child.isExpanded
  }) &&
  runs.every(run => {
    return !run.isExpanded
  })
    ? setExpandCollapse(EXPAND_TITLE, EXPAND_ICON)
    : null

  let actions = updateActions()
  // update actions to change the expand-collapse action icon
  $: $expandCollapse ? (actions = updateActions()) : null

  /**
   * create actions according to the job list role
   */
  function updateActions() {
    let actions = [
      {
        title: 'Create New Job From Existing File',
        icon: 'new-file',
        onClick: () => {
          uploadConf(path + (title === JOB_LIST ? '' : title))
        },
      },
      {
        title: 'Create New Job',
        icon: 'diff-added',
        onClick: () => {
          createRun()
        },
      },
      {
        title: $expandCollapse.title,
        icon: $expandCollapse.icon,
        onClick: expandCollapseAll,
        disabled: !(
          children.length ||
          (runs.length &&
            runs.find(run => {
              return (
                run.status === Status.success ||
                run.status === Status.incompleteResults
              )
            }))
        ),
      },
    ]
    if (title === JOB_LIST) {
      const additionalAction = {
        title: 'Open Dir',
        icon: 'file-directory-create',
        onClick: () => {
          UploadDir(path + (title === JOB_LIST ? '' : title), true)
        },
      }
      actions = [additionalAction, ...actions]
    }
    if (runs.length) {
      const runAllAction = {
        title: 'Run All',
        icon: 'run-all',
        onClick: runAll,
      }
      actions = [runAllAction, ...actions]
    }
    return actions
  }

  function setExpandCollapse(title: string, icon: string) {
    $expandCollapse.title = title
    $expandCollapse.icon = icon
  }

  onMount(() => {
    window.addEventListener('message', listener)
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
        const curReportLink = e.data.payload.verificationReportLink
        const run = runs.find(run => {
          return run.confPath === vrName
        })
        const runName = run?.name
        const confPath = run?.confPath
        if (!run || !runName || !confPath) return
        runs = runs.map(r => {
          if (r.confPath === vrName) {
            r.id = pid
            r.vrLink = curReportLink
          }
          return r
        })
        if (e.data.payload.jobStatus === 'FAILED') {
          setStoppedJobStatus(confPath)
          return
        }
        smartMergeVerificationResult(
          $verificationResults,
          e.data.payload,
          confPath,
        )
        $verificationResults = $verificationResults

        const thisRun = e.data.payload
        if (!thisRun.jobEnded) {
          runs = setStatus(confPath, Status.incompleteResults)
        }

        if (thisRun.jobStatus === 'RUNNING' && thisRun.jobEnded) {
          runs = setStatus(confPath, Status.success)
        }

        if (e.data.payload.jobStatus === 'SUCCEEDED') {
          removeScript(confPath)
          setStoppedJobStatus(confPath)
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
        const curRun = runs.find(run => {
          return run.id === pid
        })

        if (curRun !== undefined) {
          const runName = curRun.confPath
          if (
            curRun.status === Status.running ||
            curRun.status === Status.pending
          ) {
            if (
              $verificationResults.find(vr => {
                return vr.name === curRun.confPath
              })
            ) {
              runs = setStatus(runName, Status.success)
            } else {
              runs = setStatus(runName, Status.ready)
            }
          } else if (curRun.status === Status.incompleteResults) {
            setStoppedJobStatus(runName)
          }
          runningScripts = runningScripts.filter(rs => {
            return rs.pid !== pid
          })
        }
        break
      }
      case EventTypesFromExtension.AllowRun: {
        log({
          action: 'Received "allow-run" command',
          source: Sources.ResultsWebview,
          info: e.data.payload,
        })
        // status is changed to 'ready' when job is allowed to run
        const runPath = e.data.payload
        const curRun = runs.find(run => {
          return run.confPath === runPath
        })
        // don't change status of running job
        if (
          !curRun ||
          (curRun &&
            (curRun.status === Status.pending ||
              curRun.status === Status.running))
        )
          return
        let newStatus = Status.ready
        if (
          $verificationResults.find(vr => {
            return vr.name === runPath
          }) !== undefined
        ) {
          newStatus = Status.success
        }
        if (
          curRun?.status === Status.jobFailed ||
          curRun?.status === Status.incompleteResults
        ) {
          return
        }
        runs = setStatus(runPath, newStatus)
        break
      }
      case EventTypesFromExtension.BlockRun: {
        log({
          action: 'Received "block-run" command',
          source: Sources.ResultsWebview,
          info: e.data.payload,
        })
        // status is changed to 'finish setup' when job isn't allowed to run
        // don't change status of running job
        const runName = e.data.payload
        const curRun = runs.find(run => {
          return run.confPath === runName
        })
        if (
          curRun &&
          (curRun.status === Status.pending ||
            curRun.status === Status.running ||
            curRun.status === Status.incompleteResults)
        )
          return
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
        const runName = e.data.payload
        const curRun = runs.find(run => {
          return run.confPath === runName
        })
        if (
          curRun &&
          (curRun.status === Status.pending ||
            curRun.status === Status.running ||
            curRun.status === Status.incompleteResults)
        )
          return
        runs = setStatus(e.data.payload, Status.settingsError)
        break
      }
      case EventTypesFromExtension.clearResults: {
        log({
          action: 'Received "clear-results" command',
          source: Sources.ResultsWebview,
          info: e.data.payload,
        })
        const name = e.data.payload
        $verificationResults = $verificationResults.filter(vr => {
          return vr.name !== name
        })
        runs = runs.map(run => {
          if (run.confPath === name) {
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
        const runPath = e.data.payload.confFile
        const logFile = e.data.payload.logFile
        const curRun = runs.find(run => {
          return run.confPath === runPath
        })
        if (curRun && logFile) {
          runs = runs.map(r => {
            if (r.confPath === runPath) {
              r.vrLink = logFile
            }
            return r
          })
        }
        enableEdit({
          confPath: runPath,
          displayName: namesMap.get(getFileName(runPath)),
        })
        removeScript(runPath)
        runs = setStatus(runPath, Status.jobFailed)
        break
        // const runName = e.data.payload.confFile
        // runs = setStatus(runName, Status.jobFailed)
        // if (
        //   runs.find(run => {
        //     return run.confPath === runName
        //   })
        // ) {
        //   enableEdit({
        //     confPath: runName,
        //     displayName: namesMap.get(getFileName(runName)),
        //   })
        // }
        // break
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
      case EventTypesFromExtension.RunningScriptChanged: {
        log({
          action: 'Received "running-scripts-changed" command',
          source: Sources.ResultsWebview,
          info: e.data.payload,
        })
        if (!e.data.payload || !e.data.payload.length) return
        runs = runs.map(r => {
          runningScripts.forEach(rs => {
            if (r.confPath === rs.confFile) {
              r.id = rs.pid
              r.status = Status.running
            }
          })
          return r
        })
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
          }
          return rs
        })
        runs = runs.map(run => {
          if (run.id === curPid) {
            run.vrLink = vrLink
            // run.status = Status.running
            confToEnable.displayName = namesMap.get(run.name)
          }
          return run
        })
        if (confToEnable.displayName) enableEdit(confToEnable)
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
          deleteRun(runToDelete)
        }
        // no empty children!!
        children = children.filter(js => {
          return js.children.length || js.runs.length
        })
        break
      }
      default:
        break
    }
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
        runs = setStatus(jobName, Status.jobFailed)
        return
      }
      $verificationResults = $verificationResults.map(vr => {
        if (vr.name === jobName) {
          runs = setStatus(jobName, Status.success)
          return vr
        }
        const curRun = runs.find(run => {
          return run.confPath === jobName
        })
        if (
          curRun?.status === Status.running ||
          curRun?.status === Status.ready
        ) {
          runs = setStatus(jobName, Status.jobFailed)
        }
        return vr
      })
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
    // $verificationResults = $verificationResults.filter(vr => {
    //   return vr.name !== run.confPath
    // })
    pendingQueueCounter--
    if (
      $verificationResults.find(vr => {
        return vr.name === run.confPath
      })
    ) {
      runs = setStatus(run.confPath, Status.success)
      return
    }
    runs = setStatus(run.confPath, Status.ready)
  }

  /**
   * set the status of the run named [runName] to be [value]
   * @param runConfPath name of a run
   * @param value status
   * @returns new list of runs after change
   */
  function setStatus(runConfPath: string, value: Status): Run[] {
    runs = runs.map(run => {
      if (
        run.confPath === runConfPath &&
        !(
          run.status === Status.success &&
          value !== Status.pending &&
          value !== Status.running
        )
      ) {
        run.status = value
      }
      return run
    })
    return runs
  }

  /**
   * run all the runs that are allowed to run
   */
  function runAll(): void {
    const jobsToRun = runs.filter(singleRun => {
      return (
        singleRun.status === Status.ready || singleRun.status === Status.success
      )
    })
    jobsToRun.forEach((job, index) => {
      run(job, index)
    })
  }

  /**
   * adds a new run to runs array and increase the counter
   * @param run new run. if doest exists - creates a new run object
   */
  function createRun(run?: Run): void {
    if (run) {
      if (!run.status) {
        run.status = Status.missingSettings
      }
      runsCounter = runs.push(run)
    } else {
      // don't create more than one new run while in rename state
      if (runs.find(r => r.name === '')) return
      const newRun: Run = {
        id: runs.length,
        name: '',
        confPath: '',
        status: Status.missingSettings,
        showContextMenu: false,
        isExpanded: false,
      }
      runsCounter = runs.push(newRun)
    }
  }

  /**
   * operates the expand / collapse functionality
   */
  function expandCollapseAll() {
    if (
      !children.length &&
      !runs.find(run => {
        return (
          run.status === Status.success ||
          run.status === Status.incompleteResults
        )
      })
    )
      return
    if (runs.length) {
      runs = runs.map(run => {
        if (!run.isExpanded && $expandCollapse.title === EXPAND_TITLE)
          run.isExpanded = true
        if (run.isExpanded && $expandCollapse.title === COLLAPSE_TITLE)
          run.isExpanded = false
        return run
      })
    }
    if (children.length) {
      children = children.map(child => {
        if (!child.isExpanded && $expandCollapse.title === EXPAND_TITLE) {
          child.isExpanded = true
        }
        if (child.isExpanded && $expandCollapse.title === COLLAPSE_TITLE) {
          child.isExpanded = false
        }
        return child
      })
    }
    $expandCollapse.title === EXPAND_TITLE
      ? setExpandCollapse(COLLAPSE_TITLE, COLLAPSE_ICON)
      : setExpandCollapse(EXPAND_TITLE, EXPAND_ICON)
  }

  function showMenu(e, run) {
    $pos = { x: e.clientX, y: e.pageY }
    resetHide()
    runs = runs.map(singleRun => {
      if (singleRun === run) {
        singleRun.showContextMenu = true
      }
      return singleRun
    })
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
    const name = runToDelete.confPath

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
    namesMap.delete(runToDelete.name)
    if (output && outputRunName === name) {
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
      const curRun = runs.find(singleRun => {
        return singleRun.name === newName
      })

      const oldPath = curRun.confPath.replace(
        newName + '.conf',
        oldName + '.conf',
      )

      $verificationResults = $verificationResults.map(vr => {
        if (vr.name === oldPath) {
          vr.name = curRun.confPath
        }
        return vr
      })

      const oldConfNameMap: JobNameMap = {
        confPath: oldPath,
        displayName: namesMap.get(oldName),
      }
      const newConfNameMap: JobNameMap = {
        confPath: curRun.confPath,
        displayName: namesMap.get(newName),
      }

      namesMap.delete(oldName)
      runs = runs.filter(run => {
        return run.name !== oldName
      })

      rename(oldConfNameMap, newConfNameMap)
      focusedRun = newConfNameMap.confPath
    }
    // rename new run
    else {
      const titleToUse = title === JOB_LIST ? '' : title
      const newPath = `${path + titleToUse}${CERTORA_CONF}${newName}.conf`
      const jobNameMap: JobNameMap = {
        confPath: newPath,
        displayName: namesMap.get(newName),
      }
      runs = runs.map(run => {
        if (run.name === newName) {
          run.confPath = newPath
        }
        return run
      })
      openSettings(jobNameMap)
      focusedRun = newPath
    }
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
      showContextMenu: false,
      isExpanded: false,
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
      focusedRun = newPath
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

    if (output && outputRunName === run.name) {
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
      runs = setStatus(curRun.confPath, Status.running)
      runs = runs.map(run => {
        if (run.confPath === curRun.confPath) {
          run.vrLink = ''
        }
        return run
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
</script>

<div>
  <div>
    <Pane
      title={title === JOB_LIST ? `${title} (${path.split('/').pop()})` : title}
      actions={title === JOB_LIST ? [] : actions}
      fixedActions={title === JOB_LIST ? actions : []}
      bind:isExpanded
    >
      <ul
        class={'running-scripts ' +
          (title === JOB_LIST ? 'invisible-border' : '')}
      >
        {#each Array(runsCounter) as _, index (index)}
          <li
            on:contextmenu|stopPropagation|preventDefault={e => {
              showMenu(e, runs[index])
            }}
          >
            <NewRun
              editFunc={() => editRun(runs[index])}
              deleteFunc={() => askToDeleteThis(runs[index])}
              deleteRun={() => deleteRun(runs[index])}
              {renameRun}
              duplicateFunc={duplicateRun}
              runFunc={() => run(runs[index])}
              {newFetchOutput}
              pendingStopFunc={() => {
                pendingStopFunc(runs[index])
              }}
              runningStopFunc={() => {
                enableEdit({
                  confPath: runs[index].confPath,
                  displayName: namesMap.get(runs[index].name),
                })
                const modal = runs[index].status !== Status.running
                stopScript(runs[index].id, modal)
              }}
              inactiveSelected={focusedRun}
              pos={$pos}
              {resetHide}
              bind:vrLink={runs[index].vrLink}
              bind:status={runs[index].status}
              bind:hide={runs[index].showContextMenu}
              bind:namesMap
              bind:runName={runs[index].name}
              bind:pathToConf={runs[index].confPath}
              bind:isExpanded={runs[index].isExpanded}
            />
          </li>
        {/each}
      </ul>
      <div
        class={'running-scripts ' +
          (title === JOB_LIST ? 'invisible-border' : '')}
        on:contextmenu|stopPropagation|preventDefault={() => {
          resetHide()
        }}
      >
        {#each children as child, index}
          <svelte:self
            {resetHide}
            bind:path={child.path}
            bind:title={child.title}
            bind:runs={child.runs}
            bind:namesMap={child.namesMap}
            bind:children={child.children}
            bind:output
            bind:isExpanded={child.isExpanded}
            bind:focusedRun
            bind:runningScripts
            bind:pendingQueue
          />
        {/each}
      </div>
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
    margin-left: 10px;
    margin-top: 0;
    margin-bottom: 0;
    list-style-type: none;
    border-left: 1px solid rgb(255 255 255 / 20%);
  }

  .invisible-border {
    border-color: transparent;
  }
</style>
