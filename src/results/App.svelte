<script lang="ts">
  /* ---------------------------------------------------------------------------------------------
   *  Main file of the Results part of the extension.
   *  creates runs under MY RUNS pane, creates action buttons, sends actions
   *  like edit, run etc.
   *-------------------------------------------------------------------------------------------- */

  import { onMount, onDestroy } from 'svelte'
  import Pane from './components/Pane.svelte'
  import CodeItemList from './components/CodeItemList.svelte'
  import Tree from './components/Tree.svelte'
  import ContractCallResolution from './components/ContractCallResolution.svelte'
  import {
    runScript,
    stopScript,
    openSettings,
    getOutput,
    editConfFile,
    deleteConf,
    duplicate,
    removeScript,
  } from './extension-actions'
  import { smartMergeVerificationResult } from './utils/mergeResults'
  import { log, Sources } from './utils/log'
  import {
    Assert,
    Output,
    EventsFromExtension,
    Rule,
    Verification,
    Run,
    ConfNameMap,
    Status,
  } from './types'
  import { TreeType, CallTraceFunction, EventTypesFromExtension } from './types'
  import NewRun from './components/NewRun.svelte'

  let output: Output
  let outputRunName: string
  let selectedCalltraceFunction: CallTraceFunction

  let verificationResults: Verification[] = []
  let runningScripts: { pid: number; confFile: string; uploaded: boolean }[] =
    []
  let runs: Run[] = []
  let pendingQueue: ConfNameMap[] = []
  let pendingQueueCounter = 0
  let namesMap: Map<string, string> = new Map()
  let runsCounter = 0
  let focusedRun: string = ''

  function newFetchOutput(e: CustomEvent<Assert | Rule>, vr: Verification) {
    let clickedRuleOrAssert = e.detail

    const index = vr.jobs.findIndex(
      job => job.jobId === clickedRuleOrAssert.jobId,
    )

    if (index > -1) {
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

  function selectCalltraceFunction(e: CustomEvent<CallTraceFunction>) {
    selectedCalltraceFunction = e.detail
  }

  function clearOutput() {
    if (output) output = undefined
    if (selectedCalltraceFunction) selectedCalltraceFunction = undefined
  }

  const listener = (e: MessageEvent<EventsFromExtension>) => {
    switch (e.data.type) {
      case EventTypesFromExtension.ReceiveNewJobResult: {
        log({
          action: 'Smart merge current results with new result',
          source: Sources.ResultsWebview,
          info: {
            currentVerificationResults: verificationResults,
            newResult: e.data.payload,
            name: e.data.payload.runName,
          },
        })
        setVerificationReportLink(
          e.data.payload.runName,
          e.data.payload.verificationReportLink,
        )
        smartMergeVerificationResult(
          verificationResults,
          e.data.payload,
          e.data.payload.runName,
        )
        verificationResults = verificationResults
        if (e.data.payload.jobStatus === 'SUCCEEDED') {
          if (e.data.payload.runName) {
            removeScript(e.data.payload.runName)
          }
          runs = setStatus(e.data.payload.runName, Status.success)
        }
        log({
          action: 'After Smart merge current results with new result',
          source: Sources.ResultsWebview,
          info: {
            updatedVerificationResults: verificationResults,
          },
        })
        break
      }
      case EventTypesFromExtension.UploadingFiles: {
        log({
          action: 'Received "run-next" command',
          source: Sources.ResultsWebview,
          info: e.data.payload,
        })
        const curPid = e.data.payload
        runningScripts.forEach(rs => {
          if (rs.pid === curPid) {
            rs.uploaded = true
          }
        })
        runningScripts = runningScripts
        // when we recieve the results of the last run, we run the next job!
        runNext()
        break
      }
      case EventTypesFromExtension.RunningScriptChanged: {
        log({
          action: 'Received "running-scripts-changed" command',
          source: Sources.ResultsWebview,
          info: e.data.payload,
        })
        runningScripts = e.data.payload
        runs.forEach(r => {
          runningScripts.forEach(rs => {
            if (r.name === getFilename(rs.confFile)) {
              r.id = rs.pid
            }
          })
        })

        // if there is no running script - run next
        if (e.data.payload.length === 0) {
          runNext()
        }
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
          runs = setStatus(curRun.name, Status.ready)
        }
        runningScripts = runningScripts.filter(rs => {
          return rs.pid !== pid
        })
        break
      }
      case EventTypesFromExtension.SetOutput: {
        log({
          action: 'Received "get-output" command',
          source: Sources.ResultsWebview,
          info: e.data.payload,
        })
        if (e.data.payload) {
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
        runs = setStatus(e.data.payload, Status.ready)
        break
      }
      case EventTypesFromExtension.BlockRun: {
        log({
          action: 'Received "block-run" command',
          source: Sources.ResultsWebview,
          info: e.data.payload,
        })
        // status is changed to 'finish setup' when job isn't allowed to run
        runs = setStatus(e.data.payload, Status.finishSetup)
        break
      }
      case EventTypesFromExtension.ClearAllJobs: {
        log({
          action: 'Received "clear-all-jobs" command',
          source: Sources.ResultsWebview,
          info: {
            currentVerificationResults: verificationResults,
          },
        })
        if (verificationResults.length > 0) verificationResults = []
        clearOutput()
        break
      }
      case EventTypesFromExtension.CreateJob: {
        log({
          action: 'Received "create-new-job" command',
          source: Sources.ResultsWebview,
        })
        createRun({ id: runs.length, name: '', status: Status.finishSetup })
        break
      }
      case EventTypesFromExtension.FocusChanged: {
        log({
          action: 'Received "focus-changed" command',
          source: Sources.ResultsWebview,
          info: e.data.payload,
        })
        focusedRun = e.data.payload
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
  function setVerificationReportLink(runName: string, link: string) {
    runs.forEach(run => {
      if (run.name === runName) {
        run.vrLink = link
      }
    })
  }

  /**
   * set the status of the run named [runName] to be [value]
   * @param runName name of a run
   * @param value status
   * @returns new list of runs after change
   */
  function setStatus(runName: string, value: Status): Run[] {
    runs.forEach(run => {
      if (run.name === runName) {
        run.status = value
      }
    })
    return runs
  }

  /**
   * duplicate [name to duplicate] into [duplicatedName]
   * this will create a new run and a new conf file with a duplicated name
   * @param nameToDuplicate
   * @param duplicatedName
   */
  function duplicateRun(nameToDuplicate: string, duplicatedName: string): void {
    const toDuplicate: Run = runs.find(run => run.name === nameToDuplicate)

    // the status of the new run cannot be 'success' (havn't run yet => no results)
    let newStatus = toDuplicate.status
    if (newStatus === Status.success) {
      newStatus = Status.ready
    }

    const duplicated: Run = {
      id: runs.length,
      name: duplicatedName,
      status: newStatus,
    }

    createRun(duplicated)

    const confNameMapDuplicated: ConfNameMap = {
      fileName: duplicated.name,
      displayName: namesMap.get(duplicated.name),
    }

    const confNameMapToDuplicate: ConfNameMap = {
      fileName: toDuplicate.name,
      displayName: namesMap.get(toDuplicate.name),
    }

    duplicate(confNameMapToDuplicate, confNameMapDuplicated)
    focusedRun = duplicatedName
  }

  /**
   * adds a new run to runs array and increase the counter
   * @param run new run. if doest exists - creates a new run object
   */
  function createRun(run?: Run): void {
    if (run) {
      runsCounter = runs.push(run)
    } else {
      runsCounter = runs.push({
        id: runs.length,
        name: '',
        status: Status.finishSetup,
      })
    }
  }

  function editRun(run: Run): void {
    const confNameMap: ConfNameMap = {
      fileName: run.name,
      displayName: namesMap.get(run.name),
    }
    editConfFile(confNameMap)
  }

  /**
   * deletes a run, it's conf file and it's results
   * @param runToDelete run to delete
   */
  function deleteRun(runToDelete: Run): void {
    const name = runToDelete.name

    //delete results
    verificationResults = verificationResults.filter(vr => {
      return vr.name !== name
    })
    const confNameMap: ConfNameMap = {
      fileName: name,
      displayName: namesMap.get(name),
    }
    //delete run
    runs = runs.filter(run => {
      return run !== runToDelete
    })
    namesMap.delete(name)

    if (output && output.runName === name) {
      clearOutput()
    }

    //delete conf file
    deleteConf(confNameMap)
    runsCounter--
  }

  /**
   * either run this run or add to pending queue
   * @param run run to run
   * @param index if 0 - run, else: add to pending queue
   */
  function run(run: Run, index = 0): void {
    const confNameMap: ConfNameMap = {
      fileName: run.name,
      displayName: namesMap.get(run.name),
    }

    //add to pending queue
    pendingQueue.push(confNameMap)
    pendingQueueCounter++

    if (output && output.runName === run.name) {
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
      let oldResult = verificationResults.find(vr => vr.name === oldName)
      if (oldResult !== undefined) {
        let newResult: Verification = {
          name: newName,
          contract: oldResult.contract,
          spec: oldResult.spec,
          jobs: oldResult.jobs,
        }
        verificationResults = verificationResults.filter(vr => {
          return vr.name !== oldName
        })
        verificationResults.push(newResult)
      }

      const oldConfNameMap: ConfNameMap = {
        fileName: oldName,
        displayName: namesMap.get(oldName),
      }
      const newConfNameMap: ConfNameMap = {
        fileName: newName,
        displayName: namesMap.get(newName),
      }

      duplicate(oldConfNameMap, newConfNameMap)
      deleteConf(oldConfNameMap)
      namesMap.delete(oldName)
    }
    // rename new run
    else {
      const confNameMap: ConfNameMap = {
        fileName: newName,
        displayName: namesMap.get(newName),
      }
      openSettings(confNameMap)
    }
    focusedRun = newName
  }

  /**
   * run the fisrt pending run in the queue
   */
  function runNext(): void {
    if (pendingQueue.length > 0) {
      let curRun = pendingQueue.shift()
      pendingQueueCounter--
      verificationResults = verificationResults.filter(vr => {
        return vr.name !== curRun.fileName
      })
      runScript(curRun)
    }
  }

  /**
   * from conf file uri to only the file name
   */
  function getFilename(confFile: string): string {
    return confFile.replace('conf/', '').replace('.conf', '')
  }

  /**
   * run all the runs that are allowed to run
   */
  function runAll(): void {
    runs.forEach((singleRun, index) => {
      // runs with these statuses should not run automatically
      if (
        singleRun.status === Status.finishSetup ||
        singleRun.status === Status.pending ||
        singleRun.status === Status.running ||
        singleRun.status === Status.unableToRun
      ) {
        return
      }
      const nowRunning = runningScripts.find(script => {
        return getFilename(script.confFile) === singleRun.name
      })
      const inQueue = pendingQueue.find(pendingRun => {
        return pendingRun.fileName === singleRun.name
      })
      //make sure runs arn't ran in parallel to themself
      if (inQueue === undefined && nowRunning === undefined) {
        run(singleRun, index)
      }
    })
  }

  /**
   * stops a pending run
   */
  function pendingStopFunc(run: Run): void {
    pendingQueue = pendingQueue.filter(rq => {
      return rq.fileName !== run.name
    })
    verificationResults = verificationResults.filter(vr => {
      return vr.name !== run.name
    })
    pendingQueueCounter--
    runs = setStatus(run.name, Status.ready)
  }

  onMount(() => {
    window.addEventListener('message', listener)
  })

  onDestroy(() => {
    window.removeEventListener('message', listener)
  })
</script>

{#if runsCounter === 0}
  <div class="zero-state">
    <div class="command">
      <div class="command-description">
        To check your smart contract start by creating a verification run
      </div>
      <vscode-button class="command-button" on:click={() => createRun()}>
        Create verification run
      </vscode-button>
    </div>
  </div>
{:else}
  <div>
    <Pane
      title="JOB LIST"
      initialExpandedState={true}
      actions={[
        {
          title: 'run all',
          icon: 'run-all',
          onClick: runAll,
        },
        {
          title: 'create new run',
          icon: 'diff-added',
          onClick: createRun,
        },
      ]}
    >
      <ul class="running-scripts">
        {#each Array(runsCounter) as _, index (index)}
          {#key [runs[index], focusedRun, runs[index].status, verificationResults, runningScripts]}
            <li>
              <NewRun
                doRename={runs[index].name === ''}
                editFunc={() => editRun(runs[index])}
                deleteFunc={() => deleteRun(runs[index])}
                {namesMap}
                {renameRun}
                duplicateFunc={duplicateRun}
                runFunc={() => run(runs[index])}
                status={runs[index].status}
                {verificationResults}
                {newFetchOutput}
                nowRunning={(runningScripts.find(
                  rs => getFilename(rs.confFile) === runs[index].name,
                ) !== undefined ||
                  (pendingQueue.find(rs => rs.fileName === runs[index].name) !==
                    undefined &&
                    pendingQueueCounter > 0)) &&
                  verificationResults.find(
                    vr => runs[index].name === vr.name,
                  ) === undefined}
                isPending={pendingQueue.find(
                  rs => rs.fileName === runs[index].name,
                ) !== undefined && pendingQueueCounter > 0}
                expandedState={verificationResults.find(
                  vr => vr.name === runs[index].name,
                ) !== undefined}
                pendingStopFunc={() => {
                  pendingStopFunc(runs[index])
                }}
                runningStopFunc={() => {
                  verificationResults = verificationResults.filter(vr => {
                    return vr.name !== runs[index].name
                  })
                  runs = setStatus(runs[index].name, Status.ready)
                  stopScript(runs[index].id)
                  // runNext()
                }}
                inactiveSelected={focusedRun}
                {setStatus}
                vrLink={runs[index].vrLink}
                bind:runName={runs[index].name}
              />
            </li>
          {/key}
        {/each}
      </ul>
    </Pane>
  </div>
{/if}
{#if output}
  {#if output.variables && output.variables.length > 0}
    <Pane
      title={`${output.treeViewPath.ruleName} variables`}
      initialExpandedState={true}
      actions={[
        {
          title: 'Close Output',
          icon: 'close',
          onClick: clearOutput,
        },
      ]}
    >
      <CodeItemList codeItems={output.variables} />
    </Pane>
  {/if}
  {#if output.callTrace && Object.keys(output.callTrace).length > 0}
    <Pane title={`CALL TRACE`} initialExpandedState={true}>
      <Tree
        data={{
          type: TreeType.Calltrace,
          tree: [output.callTrace],
        }}
        on:selectCalltraceFunction={selectCalltraceFunction}
      />
    </Pane>
  {/if}
  {#if selectedCalltraceFunction && selectedCalltraceFunction.variables && selectedCalltraceFunction.variables.length > 0}
    <Pane
      title={`${selectedCalltraceFunction.name} variables`}
      initialExpandedState={true}
    >
      <CodeItemList codeItems={selectedCalltraceFunction.variables} />
    </Pane>
  {/if}
  {#if output.callResolutionWarnings && output.callResolutionWarnings.length > 0}
    <Pane
      title={`Contract call resolution warnings`}
      initialExpandedState={true}
    >
      {#each output.callResolutionWarnings as resolution}
        <ContractCallResolution contractCallResolution={resolution} />
      {/each}
    </Pane>
  {/if}
  {#if output.callResolution && output.callResolution.length > 0}
    <Pane title={`Contract call resolution`} initialExpandedState={true}>
      {#each output.callResolution as resolution}
        <ContractCallResolution contractCallResolution={resolution} />
      {/each}
    </Pane>
  {/if}
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
      margin-bottom: 8px;
      line-height: 16px;
    }
  }

  .running-scripts {
    padding: 0;
    margin: 0;
    list-style-type: none;
  }
</style>
