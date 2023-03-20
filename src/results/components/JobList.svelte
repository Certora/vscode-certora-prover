<script lang="ts">
  /* ---------------------------------------------------------------------------------------------
   *  Main file of the Results part of the extension.
   *  creates runs under MY RUNS pane, creates action buttons, sends actions
   *  like edit, run etc.
   *-------------------------------------------------------------------------------------------- */

  import { onMount, onDestroy } from 'svelte'
  import Pane from '../components/Pane.svelte'
  import OutputView from './OutputView.svelte'
  import {
    runScript,
    stopScript,
    openSettings,
    getOutput,
    editConfFile,
    deleteConf,
    duplicate,
    removeScript,
    askToDeleteJob,
    initResults,
    uploadConf,
    enableEdit,
    rename,
  } from '../extension-actions'
  import { smartMergeVerificationResult } from '../utils/mergeResults'
  import { log, Sources } from '../utils/log'
  import {
    Assert,
    Output,
    EventsFromExtension,
    Rule,
    Verification,
    Run,
    JobNameMap,
    Status,
    CONF_DIRECTORY,
    RuleStatuses,
    JobList,
  } from '../types'
  import {
    TreeType,
    CallTraceFunction,
    EventTypesFromExtension,
  } from '../types'
  import NewRun from '../components/NewRun.svelte'

  import { Writable, writable } from 'svelte/store'
  import {
    expandables,
    expandCollapse,
    jobLists,
    verificationResults,
  } from '../store/store'
  import type { Uri } from 'vscode'

  export let jobList: JobList

  export let pendingQueue: JobNameMap[]
  export let runningScripts: {
    pid: number
    confFile: string
    uploaded: boolean
  }[]
  export let runNext

  export const hide: Writable<{ names: boolean[]; uri: Uri }> = writable({
    names: [],
    uri: jobList.dirPath,
  })
  export const pos = writable({ x: 0, y: 0 })
  export const focusedRun = writable({ name: '', path: jobList.dirPath })

  $: jobList ? updateJobList() : null

  let output: Output
  let outputRunName: { fileName: string; jobListPath: Uri }
  let selectedCalltraceFunction: CallTraceFunction

  // let runs: Run[] = []

  let namesMap: Map<string, string> = new Map()
  let runsCounter = 0

  // listen to the results array to see if there are results or not
  $: $verificationResults.length > 0
    ? ($expandCollapse.hasResults = true)
    : ($expandCollapse.hasResults = false)

  function updateJobList() {
    console.log('update job list')

    if (jobList.jobs?.length > 0) {
      jobList.jobs.forEach(file => {
        if (!namesMap.has(file.name.fileName)) {
          console.log(file.name, file)
          namesMap.set(
            file.name.fileName,
            file.name.fileName.replaceAll('_', ' '),
          )
          // createRun(newRun)
        }
      })
      // runs = jobList.jobs
      runsCounter = jobList.jobs.length
    }

    $expandables.push({
      title: jobList.title,
      jobListPath: jobList.dirPath,
      isExpanded: true,
      tree: [],
      isJobList: false,
    })
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
        clickedRuleOrAssert.output.length > 0
      ) {
        curOutput = clickedRuleOrAssert.output[0]
      }
      const outputUrl = `${vr.jobs[index].progressUrl.replace(
        'progress',
        'result',
      )}&output=${clickedRuleOrAssert.output}`
      getOutput(outputUrl)
      outputRunName = {
        fileName: vr.name,
        jobListPath: jobList.dirPath,
      }
    } else {
      console.log(
        'Error occurred while fetching the output - job id is  undefined',
      )
    }
  }

  // function selectCalltraceFunction(e: CustomEvent<CallTraceFunction>) {
  //   selectedCalltraceFunction = e.detail
  // }

  function clearOutput() {
    if (output) output = undefined
    if (selectedCalltraceFunction) selectedCalltraceFunction = undefined
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
            jobListPath: jobList.dirPath,
            isExpanded: false,
            tree: [],
            isJobList: false,
          }
        })
        $expandables = $expandables.map(element => {
          if (
            element.title === namesMap.get(job.runName) &&
            element.tree.length === 0
          ) {
            element.tree = temp
          }
          return element
        })
      })
    })
  }

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
        const run = jobList.jobs.find(run => {
          return run.id === pid
        })
        console.log('run and name: ', run, run?.name)
        const runName = run?.name
        if (!run || !runName) return
        // setVerificationReportLink(pid, e.data.payload.verificationReportLink)
        if (e.data.payload.jobStatus === 'FAILED') {
          setStoppedJobStatus(runName.fileName)
          return
        }
        smartMergeVerificationResult(
          $verificationResults,
          e.data.payload,
          runName.displayName,
          pid,
        )
        $verificationResults = $verificationResults
        updateExpendablesFromResults()
        const thisRun = $verificationResults.find(vr => {
          return vr.name === runName.displayName
        })
        if (
          thisRun?.jobs.find(job => {
            return !job.jobEnded
          }) !== undefined
        ) {
          jobList = setStatus(runName.fileName, Status.incompleteResults)
        }

        if (e.data.payload.jobStatus === 'SUCCEEDED') {
          removeScript(runName.fileName)
          jobList = setStatus(runName.fileName, Status.success)
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
        const curRun = jobList.jobs.find(run => run.id === pid)
        if (curRun !== undefined) {
          const runName = curRun.name
          setStoppedJobStatus(runName.fileName)
        }
        console.log('running scripts before filter', runningScripts)
        runningScripts = runningScripts.filter(rs => {
          return rs.pid !== pid
        })
        console.log('running scripts before filter', runningScripts)

        break
      }
      case EventTypesFromExtension.SetOutput: {
        log({
          action: 'Received "get-output" command',
          source: Sources.ResultsWebview,
          info: e.data.payload,
        })
        if (
          e.data.payload &&
          ((e.data.payload.callResolution &&
            e.data.payload.callResolution.length > 0) ||
            (e.data.payload.variables && e.data.payload.variables.length > 0))
        ) {
          output = e.data.payload
          output.runName = outputRunName
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
        // todo: if status is running / pending - do nothing
        const name = e.data.payload
        const runName = e.data.payload.fileName
        let newStatus = Status.ready
        const jobListPath = e.data.payload.jobListPath
        const curJob = jobList.jobs.find(job => {
          return (
            job.name.fileName === name.fileName &&
            job.name.jobListPath.path === name.jobListPath.path
          )
        })
        if (
          curJob &&
          (curJob.status === Status.pending ||
            curJob.status === Status.running ||
            curJob.status === Status.incompleteResults)
        ) {
          return
        }
        if (jobListPath.path === jobList.dirPath.path) {
          if (
            $verificationResults.find(vr => {
              return vr.name === runName
            })
          ) {
            newStatus = Status.success
          }
          jobList = setStatus(runName, newStatus)
        }
        break
      }
      case EventTypesFromExtension.BlockRun: {
        log({
          action: 'Received "block-run" command',
          source: Sources.ResultsWebview,
          info: e.data.payload,
        })
        // status is changed to 'finish setup' when job isn't allowed to run
        const name = e.data.payload.fileName
        const uri = e.data.payload.jobListPath
        if (uri.path === jobList.dirPath.path) {
          jobList = setStatus(name, Status.missingSettings)
        }
        break
      }
      case EventTypesFromExtension.SettingsError: {
        log({
          action: 'Received "settings-error" command',
          source: Sources.ResultsWebview,
          info: e.data.payload,
        })
        // status is changed to 'finish setup' when job isn't allowed to run
        const name = e.data.payload.fileName
        const uri = e.data.payload.jobListPath
        if (uri.path === jobList.dirPath.path) {
          jobList = setStatus(name, Status.settingsError)
        }
        break
      }
      case EventTypesFromExtension.ClearAllJobs: {
        log({
          action: 'Received "clear-all-jobs" command',
          source: Sources.ResultsWebview,
          info: {
            current$verificationResults: $verificationResults,
          },
        })
        if ($verificationResults.length > 0) $verificationResults = []
        clearOutput()
        break
      }
      // case EventTypesFromExtension.CreateJob: {
      //   log({
      //     action: 'Received "create-new-job" command',
      //     source: Sources.ResultsWebview,
      //   })
      //   createRun()
      //   break
      // }
      case EventTypesFromExtension.FocusChanged: {
        log({
          action: 'Received "focus-changed" command',
          source: Sources.ResultsWebview,
          info: e.data.payload,
        })
        $focusedRun = { name: e.data.payload.name, path: e.data.payload.path }
        break
      }
      case EventTypesFromExtension.ParseError: {
        log({
          action: 'Received "parse-error" command',
          source: Sources.ResultsWebview,
          info: e.data.payload,
        })
        const runName = e.data.payload
        jobList = setStatus(runName, Status.unableToRun)
        break
      }

      case EventTypesFromExtension.RunJob: {
        log({
          action: 'Received "run-job" command',
          source: Sources.ResultsWebview,
          info: e.data.payload,
        })

        const name: string = e.data.payload
        const runToRun: Run = jobList.jobs.find(r => {
          return r.name.fileName === name
        })
        if (runToRun !== undefined) {
          run(runToRun)
        }
        break
      }
      case EventTypesFromExtension.DeleteJob: {
        log({
          action: 'Received "delete-job" command',
          source: Sources.ResultsWebview,
          info: e.data.payload,
        })

        const nameToDelete: string = e.data.payload.name
        const pathOfJobList: Uri = e.data.payload.path
        if (jobList.dirPath.path === pathOfJobList.path) {
          const runToDelete: Run = jobList.jobs.find(r => {
            return r.name.fileName === nameToDelete
          })
          if (runToDelete !== undefined) {
            const jobNameMap: JobNameMap = {
              fileName: nameToDelete,
              displayName: runToDelete.name.displayName,
              jobListPath: jobList.dirPath,
            }
            deleteRun(runToDelete)
            deleteConf(jobNameMap)
          }
        }
        break
      }
      default:
        break
    }
  }

  /**
   * set vrLink of the run with name [runName] to [link]
   * @param runName name of the run to update
   * @param link to verification report of run [runName]
   */
  // function setVerificationReportLink(pid: number, link: string) {
  //   jobList.jobs = jobList.jobs.map(run => {
  //     if (run.id === pid) {
  //       run.vrLink = link
  //     }
  //     return run
  //   })
  //   return jobList
  // }

  /**
   * set the status of the run named [runName] to be [value]
   * @param runName name of a run
   * @param value status
   * @returns new list of runs after change
   */
  function setStatus(runName: string, value: Status): JobList {
    jobList.jobs.forEach(job => {
      if (
        job.name.fileName === runName &&
        !(job.status === Status.success && value === Status.ready)
      ) {
        job.status = value
      }
    })
    return jobList
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
    const toDuplicate: Run = jobList.jobs.find(
      run => run.name.fileName === nameToDuplicate,
    )

    // the status of the new run cannot be 'success' (haven't run yet => no results)
    let newStatus = toDuplicate.status
    if (newStatus === Status.success) {
      newStatus = Status.ready
    }

    const duplicated: Run = {
      id: jobList.jobs.length,
      name: {
        fileName: duplicatedName,
        displayName: namesMap.get(duplicatedName),
        jobListPath: jobList.dirPath,
      },
      status: newStatus,
    }

    const confNameMapDuplicated: JobNameMap = duplicated.name
    const confNameMapToDuplicate: JobNameMap = toDuplicate.name

    duplicate(confNameMapToDuplicate, confNameMapDuplicated, rule)
    createRun(duplicated)
    if (!rule) {
      $focusedRun = { name: duplicatedName, path: jobList.dirPath }
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
        isJobList: false,
      },
    ]
  }

  function setStoppedJobStatus(jobName: string): void {
    if (jobName) {
      removeScript(jobName)
      if ($verificationResults.length === 0) {
        jobList = setStatus(jobName, Status.ready)
        return
      }
      if (
        !$verificationResults.map(vr => {
          return vr.name === jobName
        })
      ) {
        jobList = setStatus(jobName, Status.ready)
        return
      }
      $verificationResults.forEach(vr => {
        if (vr.name === jobName) {
          jobList = setStatus(jobName, Status.success)
          vr.jobs.forEach(job => {
            job.verificationProgress.rules.forEach(rule => {
              if (rule.status === RuleStatuses.Running) {
                rule.status = RuleStatuses.Killed
              }
              rule.children.forEach(child => {
                if ((child.status = RuleStatuses.Running)) {
                  child.status = RuleStatuses.Killed
                }
              })
            })
          })
        } else if (
          jobList.jobs.find(run => {
            return run.name.fileName === jobName
          })?.status === Status.running
        ) {
          jobList = setStatus(jobName, Status.ready)
        }
      })
      $verificationResults = $verificationResults
      return
    }
  }

  /**
   * adds a new run to runs array and increase the counter
   * @param run new run. if doest exists - creates a new run object
   */
  function createRun(run?: Run): void {
    if ($hide.uri.path === jobList.dirPath.path) {
      $hide.names.push(true)
    }
    if (run) {
      console.log(run, 'this is the run')
      if (!run.status) {
        run.status = Status.missingSettings
      }
      runsCounter = jobList.jobs.push(run)
      addNewExpendable(run.name.displayName, run.name.jobListPath)
    } else {
      // don't create more than one new run while in rename state
      if (
        jobList.jobs.find(r => {
          return r.name.displayName === ''
        })
      )
        return

      jobList.jobs.push({
        id: jobList.jobs.length,
        name: {
          fileName: '',
          displayName: '',
          jobListPath: jobList.dirPath,
        },
        status: Status.missingSettings,
      })
      console.log(jobList.jobs)

      jobList = jobList

      // runsCounter = runsCounter
      addNewExpendable('', jobList.dirPath)
    }
  }

  function editRun(run: Run): void {
    const JobNameMap: JobNameMap = run.name
    editConfFile(JobNameMap)
  }

  /**
   * deletes a run and it's results
   * @param runToDelete run to delete
   */
  function deleteRun(runToDelete: Run): void {
    const name = runToDelete.name

    //delete results
    $verificationResults = $verificationResults.filter(vr => {
      return vr.name !== name.fileName
    })

    //delete from running scripts
    runningScripts = runningScripts.filter(rs => {
      return rs.confFile !== name.fileName
    })

    //delete run
    jobList.jobs = jobList.jobs.filter(run => {
      return run !== runToDelete
    })
    // jobList.jobs = runs
    jobList = jobList
    namesMap.delete(name.fileName)
    if (
      output &&
      output.runName.fileName === name.fileName &&
      output.runName.jobListPath.path === name.jobListPath.path
    ) {
      clearOutput()
    }

    // runsCounter--
  }

  /**
   * either run this run or add to pending queue
   * @param run run to run
   * @param index if 0 - run, else: add to pending queue
   */
  function run(run: Run, index = 0): void {
    run.vrLink = ''
    const JobNameMap: JobNameMap = run.name

    //add to pending queue
    console.log(pendingQueue, 'pending queue before push')

    pendingQueue.push(JobNameMap)
    console.log(pendingQueue, 'pending queue after push')
    jobList = setStatus(JobNameMap.fileName, Status.pending)
    // jobList.jobs = runs
    // pendingQueueCounter++
    $verificationResults = $verificationResults.filter(vr => {
      return vr.name !== JobNameMap.fileName
    })
    if (
      output &&
      output.runName.fileName === run.name.fileName &&
      output.runName.jobListPath.path === run.name.jobListPath.path
    ) {
      clearOutput()
    }

    const shouldRunNext = runningScripts.every(rs => {
      return rs.uploaded === true
    })
    //if there are no running scripts => runNext
    if ((runningScripts.length === 0 || shouldRunNext) && index === 0) {
      runNext()
    }
  }

  /**
   * rename the run named oldName to newName (also renames the conf file)
   * @param oldName name to change
   * @param newName new name for the run and conf
   */
  function renameRun(oldName: string, newName: string): void {
    // rename existing run
    if (oldName !== '') {
      // the renamed run should have the same verification results, if they exist
      let oldResult = $verificationResults.find(vr => vr.name === oldName)
      if (oldResult !== undefined) {
        let newResult: Verification = {
          name: newName,
          pid: oldResult.pid,
          contract: oldResult.contract,
          spec: oldResult.spec,
          jobs: oldResult.jobs,
        }
        $verificationResults = $verificationResults.filter(vr => {
          return vr.name !== oldName
        })
        $verificationResults.push(newResult)
      }

      const oldConfNameMap: JobNameMap = {
        fileName: oldName,
        displayName: namesMap.get(oldName),
        jobListPath: jobList.dirPath,
      }
      const newConfNameMap: JobNameMap = {
        fileName: newName,
        displayName: namesMap.get(newName),
        jobListPath: jobList.dirPath,
      }
      jobList.jobs = jobList.jobs.filter(job => {
        return job.name.displayName === oldName
      })
      rename(oldConfNameMap, newConfNameMap)
      // namesMap.delete(oldName)
    }
    // rename new run
    else {
      const JobNameMap: JobNameMap = {
        fileName: newName,
        displayName: namesMap.get(newName),
        jobListPath: jobList.dirPath,
      }
      openSettings(JobNameMap)
    }
    $focusedRun = { name: newName, path: jobList.dirPath }
  }

  /**
   * run the first pending run in the queue
   */
  // function runNext(): void {
  //   if (pendingQueue.length > 0) {
  //     let curRun = pendingQueue.shift()
  //     // pendingQueueCounter--
  //     $verificationResults = $verificationResults.filter(vr => {
  //       return vr.name !== curRun.fileName
  //     })
  //     runs = setStatus(curRun.fileName, Status.running)
  //     jobList.jobs = runs
  //     runScript(curRun)
  //   }
  // }

  /**
   * from conf file uri to only the file name
   */
  function getFileName(confFile: string): string {
    return confFile.replace(CONF_DIRECTORY, '').replace('.conf', '')
  }

  /**
   * run all the runs that are allowed to run
   */
  function runAll(): void {
    const jobsToRun = jobList.jobs.filter(singleRun => {
      return singleRun.status === Status.ready
    })
    jobsToRun.forEach((job, index) => {
      run(job, index)
    })
  }

  /**
   * stops a pending run
   */
  function pendingStopFunc(run: Run): void {
    pendingQueue = pendingQueue.filter(rq => {
      return (
        rq.fileName !== run.name.fileName && rq.jobListPath !== jobList.dirPath
      )
    })
    $verificationResults = $verificationResults.filter(vr => {
      return vr.name !== run.name.fileName
    })
    // pendingQueueCounter--
    jobList = setStatus(run.name.fileName, Status.ready)
  }

  /**
   * ask to delete the job "run"
   * @param run the job to delete
   */
  // function askToDeleteThis(run: Run): void {
  //   askToDeleteJob(run.name)
  // }

  /**
   * operates the expand / collapse functionality
   */
  function expandCollapseAll() {
    if ($expandCollapse.hasResults) {
      $expandables = $expandables.map(element => {
        if (!element.isJobList && element.jobListPath === jobList.dirPath) {
          element.isExpanded = $expandCollapse.var
        }
        element.tree = element.tree.map(treeItem => {
          treeItem.isExpanded = $expandCollapse.var
          return treeItem
        })
        return element
      })
      $expandCollapse.title = $expandCollapse.var
        ? 'Collapse All'
        : 'Expand All'
      $expandCollapse.icon = $expandCollapse.var ? 'collapse-all' : 'expand-all'
      $expandCollapse.var = !$expandCollapse.var
    }
  }

  onMount(() => {
    window.addEventListener('message', listener)
    // resentHide()
    // if (runs.length === 0) {
    //   initResults()
    // }
  })

  onDestroy(() => {
    window.removeEventListener('message', listener)
  })

  function resentHide() {
    $hide.names = $hide.names.map(item => {
      return (item = true)
    })
    console.log($hide)
  }

  function deleteJobList() {
    console.log('DELETE')
    $jobLists = $jobLists.filter(jl => jl !== jobList)
  }

  function showMenu(e, index) {
    if ($hide.uri.path === jobList.dirPath.path) {
      $pos = { x: e.clientX, y: e.pageY }
      resentHide()
      $hide.names[index] = false
    }
  }

  window.onclick = function (event) {
    console.log('window !!!!!!!')
    resentHide()
  }
</script>

<div>
  <Pane
    title={jobList.title}
    jobListPath={jobList.dirPath}
    fixedActions={[
      {
        title: 'Run All',
        icon: 'run-all',
        onClick: runAll,
      },
      {
        title: 'Create New Job From Existing File',
        icon: 'new-file',
        onClick: () => uploadConf(jobList.dirPath),
      },
      {
        title: 'Create New Job',
        icon: 'diff-added',
        onClick: () => createRun(),
      },
      {
        title: 'Delete Job List',
        icon: 'trash',
        onClick: deleteJobList,
      },
      {
        title: $expandCollapse.title,
        icon: $expandCollapse.icon,
        onClick: expandCollapseAll,
        disabled: !$expandCollapse.hasResults,
      },
    ]}
  >
    <ul class="running-scripts">
      {#each Array(runsCounter) as _, index (index)}
        <li
          on:contextmenu|stopPropagation|preventDefault={e => {
            showMenu(e, index)
          }}
        >
          <NewRun
            editFunc={() => editRun(jobList.jobs[index])}
            deleteFunc={() => askToDeleteJob(jobList.jobs[index].name)}
            deleteRun={() => deleteRun(jobList.jobs[index])}
            {namesMap}
            {renameRun}
            duplicateFunc={duplicateRun}
            runFunc={() => run(jobList.jobs[index])}
            status={jobList.jobs[index].status}
            {newFetchOutput}
            pendingStopFunc={() => {
              jobList = setStatus(
                jobList.jobs[index].name.fileName,
                Status.pending,
              )
              pendingStopFunc(jobList.jobs[index])
            }}
            runningStopFunc={() => {
              enableEdit(jobList.jobs[index].name)
              jobList.jobs[index].vrLink = ''
              const modal = jobList.jobs[index].status !== Status.running
              console.log('modal!!!', modal, jobList.jobs[index].status)
              stopScript(jobList.jobs[index].id, modal)
            }}
            inactiveSelected={$focusedRun.path.path === jobList.dirPath.path
              ? $focusedRun.name
              : ''}
            vrLink={jobList.jobs[index].vrLink}
            hide={true}
            pos={$pos}
            jobListUri={jobList.dirPath}
            pid={jobList.jobs[index].id}
            bind:runName={jobList.jobs[index].name.displayName}
          />
        </li>
      {/each}
    </ul>
  </Pane>
</div>
<OutputView {jobList} bind:output bind:selectedCalltraceFunction />

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
