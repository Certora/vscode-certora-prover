<script lang="ts">
  import { onMount, onDestroy } from 'svelte'
  import Pane from './components/Pane.svelte'
  import CodeItemList from './components/CodeItemList.svelte'
  import Tree from './components/Tree.svelte'
  import ContractCallResolution from './components/ContractCallResolution.svelte'
  import RunningScript from './components/RunningScript.svelte'
  import {
    runScript,
    stopScript,
    openSettings,
    getOutput,
    editConfFile,
    deleteConf,
    duplicate,
  } from './extension-actions'
  import { smartMergeVerificationResult } from './utils/mergeResults'
  import { log, Sources } from './utils/log'
  import type {
    Assert,
    Output,
    Job,
    EventsFromExtension,
    Rule,
    Verification,
    Run,
    ConfNameMap,
  } from './types'
  import { TreeType, CallTraceFunction, EventTypesFromExtension } from './types'
  import NewRun from './components/NewRun.svelte'

  let output: Output
  let selectedCalltraceFunction: CallTraceFunction

  let verificationResults: Verification[] = []
  let runningScripts: { pid: number; confFile: string }[] = []

  let runs: Run[] = []
  let namesMap: Map<string, string> = new Map()
  let runsCounter = 0

  $: hasRunningScripts = runningScripts.length > 0
  $: hasResults = verificationResults.length > 0
  $: hasRuns = runsCounter > 0

  function newFetchOutput(e: CustomEvent<Assert | Rule>, vr: Verification) {
    console.log(e.detail)
    console.log(vr)
    let clickedRuleOrAssert = e.detail

    if (!clickedRuleOrAssert.output) {
      clearOutput()
      return
    }

    const index = vr.jobs.findIndex(
      job => job.jobId === clickedRuleOrAssert.jobId,
    )

    if (index > -1) {
      const outputUrl = `${vr.jobs[index].progressUrl.replace(
        'progress',
        'result',
      )}&output=${clickedRuleOrAssert.output}`

      getOutput(outputUrl)
    } else {
      console.log(
        'Error occurred while fetching the output - job id is  undefined',
      )
    }
  }

  function retrieveRules(jobs: Job[]): Rule[] {
    // rulesArrays = [Rule[] A, Rule[]B,...]
    const rulesArrays: Rule[][] = jobs.map(
      job => job.verificationProgress.rules,
    )
    return [].concat(...rulesArrays)
  }

  function fetchOutput(e: CustomEvent<Assert | Rule>, job: Job) {
    log({
      action: 'Try to fetch output',
      source: Sources.ResultsWebview,
      info: {
        outputField: e.detail.output,
      },
    })

    if (!e.detail.output) {
      clearOutput()
      return
    }

    const outputUrl = `${job.progressUrl.replace(
      'progress',
      'result',
    )}&output=${e.detail.output}`

    getOutput(outputUrl)
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
        // log({
        //   action: 'Received "receive-new-job-result" command',
        //   source: Sources.ResultsWebview,
        //   info: {
        //     currentResults: results,
        //     newResult: e.data.payload,
        //   },
        // })
        // mergeResults(results, e.data.payload)
        // results = results
        log({
          action: 'Smart merge current results with new result',
          source: Sources.ResultsWebview,
          info: {
            currentVerificationResults: verificationResults,
            newResult: e.data.payload[0],
            name: e.data.payload[1],
          },
        })
        smartMergeVerificationResult(
          verificationResults,
          e.data.payload[0],
          e.data.payload[1],
        )
        verificationResults = verificationResults
        log({
          action: 'After Smart merge current results with new result',
          source: Sources.ResultsWebview,
          info: {
            updatedVerificationResults: verificationResults,
          },
        })
        break
      }
      case EventTypesFromExtension.RunningScriptChanged: {
        log({
          action: 'Received "running-scripts-changed" command',
          source: Sources.ResultsWebview,
          info: e.data.payload,
        })
        runningScripts = e.data.payload
        break
      }
      case EventTypesFromExtension.SetOutput: {
        log({
          action: 'Received "set-output" command',
          source: Sources.ResultsWebview,
          info: e.data.payload,
        })
        output = e.data.payload
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
        if (hasResults) verificationResults = []
        clearOutput()
        break
      }
      case EventTypesFromExtension.CreateJob: {
        log({
          action: 'Received "create-new-job" command',
          source: Sources.ResultsWebview,
        })

        createRun({ id: runs.length, name: '' })
        break
      }
      default:
        break
    }
  }

  // function createRunAndOpenSettings(run: Run) {
  //   createRun(run)
  //   const confNameMap: ConfNameMap = {
  //     fileName: run.name,
  //     displayName: namesMap.get(run.name),
  //   }
  //   console.log(confNameMap, 'create')
  //   openSettings(confNameMap)
  // }

  function duplicateRun(nameToDuplicate: string, duplicatedName: string) {
    console.log(
      'to duplicate: ',
      nameToDuplicate,
      'duplicated: ',
      duplicatedName,
    )
    const toDuplicate: Run = runs.find(run => run.name === nameToDuplicate)
    const duplicated: Run = { id: runs.length, name: duplicatedName }
    createRun(duplicated)
    const confNameMapDuplicated: ConfNameMap = {
      fileName: duplicated.name,
      displayName: namesMap.get(duplicated.name),
    }
    const confNameMapToDuplicate: ConfNameMap = {
      fileName: toDuplicate.name,
      displayName: namesMap.get(toDuplicate.name),
    }
    console.log('to duplicate:', toDuplicate, 'duplicated: ', duplicated)
    duplicate(confNameMapToDuplicate, confNameMapDuplicated)
  }

  function createRun(run?: Run) {
    console.log('===create run===')
    if (run) {
      runs.push(run)
    } else {
      runs.push({ id: runs.length, name: '' })
    }
    runsCounter++
    console.log(runsCounter, 'runs counter after creation')
  }

  function editRun(run: Run) {
    console.log('===edit===', run.name)
    const confNameMap: ConfNameMap = {
      fileName: run.name,
      displayName: namesMap.get(run.name),
    }
    console.log(confNameMap, 'edit')
    editConfFile(confNameMap)
  }

  function deleteRun(toFilter: Run) {
    const name = toFilter.name
    verificationResults = verificationResults.filter(vr => {
      return vr.name !== name
    })
    const confNameMap: ConfNameMap = {
      fileName: name,
      displayName: namesMap.get(name),
    }
    console.log('to filter:' + name)
    runs = runs.filter(run => {
      return run !== toFilter
    })

    namesMap.delete(name)
    console.log(confNameMap, 'delete')
    deleteConf(confNameMap)
    runsCounter--
  }

  function run(run: Run) {
    verificationResults = verificationResults.filter(vr => {
      return vr.name !== run.name
    })
    const confNameMap: ConfNameMap = {
      fileName: run.name,
      displayName: namesMap.get(run.name),
    }
    runScript(confNameMap)
  }

  function renameRun(oldName: string, newName: string) {
    // rename existing
    if (oldName !== '') {
      console.log('delete old ', oldName)

      let oldResult = verificationResults.find(vr => vr.name === oldName)
      console.log('===old result====', oldResult)
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
        console.log('====verification results====', verificationResults)
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
    // rename new
    else {
      const confNameMap: ConfNameMap = {
        fileName: newName,
        displayName: namesMap.get(newName),
      }
      console.log(confNameMap, 'open')
      openSettings(confNameMap)
    }
  }

  onMount(() => {
    window.addEventListener('message', listener)
  })

  onDestroy(() => {
    window.removeEventListener('message', listener)
  })
</script>

{#if !hasResults}
  <div class="zero-state">
    <!-- <div class="command">
      <div class="command-description">
        To check your smart contract start Certora IDE tool in command palette
        or with button.
      </div>
      <vscode-button class="command-button" on:click={runScript}>
        Run Certora IDE
      </vscode-button>
    </div> -->
    <div class="command">
      <div class="command-description">
        To check your smart contract start by creating a verification run
      </div>
      <vscode-button class="command-button" on:click={() => createRun()}>
        Create verification run
      </vscode-button>
    </div>
  </div>
{/if}
{#if hasRuns}
  <Pane title="MY RUNS" initialExpandedState={true} actions={[]}>
    {#each Array(runsCounter) as _, index (index)}
      <NewRun
        doRename={runs[index].name === ''}
        editFunc={() => editRun(runs[index])}
        deleteFunc={() => deleteRun(runs[index])}
        {namesMap}
        {renameRun}
        duplicateFunc={duplicateRun}
        runFunc={() => run(runs[index])}
        {verificationResults}
        {newFetchOutput}
        nowRunning={runningScripts.find(
          rs =>
            rs.confFile.replace('conf/', '').replace('.conf', '') ===
            runs[index].name,
        ) !== undefined}
        expandedState={verificationResults.find(
          vr => vr.name === runs[index].name,
        ) !== undefined}
        bind:runName={runs[index].name}
      />
    {/each}
  </Pane>
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
    <Pane title={`Call Trace`} initialExpandedState={true}>
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
<!-- {/if} -->
<Pane title="Running Scripts" initialExpandedState={true}>
  {#if hasRunningScripts}
    <ul class="running-scripts">
      {#each runningScripts as script (script.pid)}
        <li>
          <RunningScript
            title={namesMap.get(
              script.confFile.replace('conf/', '').replace('.conf', ''),
            ) || script.confFile}
            confFile={script.confFile}
            on:click={() => {
              stopScript(script.pid)
            }}
          />
        </li>
      {/each}
    </ul>
  {:else}
    <div class="zero-state">
      <div class="command">
        <div class="command-description">
          You don’t have any running scripts. To check your smart contract start
          Certora IDE tool in command palette or click the button below.
        </div>
        <!-- {#if hasResults}
          <vscode-button class="command-button" on:click={runScript}>
            Run Certora IDE
          </vscode-button>
        {/if} -->
      </div>
    </div>
  {/if}
</Pane>

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
