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
  } from './types'
  import { TreeType, CallTraceFunction, EventTypesFromExtension } from './types'

  let output: Output
  let selectedCalltraceFunction: CallTraceFunction

  let verificationResults: Verification[] = []
  let runningScripts: { pid: number; confFile: string }[] = []

  $: hasRunningScripts = runningScripts.length > 0
  $: hasResults = verificationResults.length > 0

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
            newResult: e.data.payload,
          },
        })
        smartMergeVerificationResult(verificationResults, e.data.payload)
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
      default:
        break
    }
  }

  onMount(() => {
    window.addEventListener('message', listener)
  })

  onDestroy(() => {
    window.removeEventListener('message', listener)
  })

  function retrieveRules(jobs: Job[]): Rule[] {
    // rulesArrays = [Rule[] A, Rule[]B,...]
    const rulesArrays: Rule[][] = jobs.map(
      job => job.verificationProgress.rules,
    )
    return [].concat(...rulesArrays)
  }
</script>

{#if !hasResults}
  <div class="zero-state">
    <div class="command">
      <div class="command-description">
        To check your smart contract start Certora IDE tool in command palette
        or with button.
      </div>
      <vscode-button class="command-button" on:click={runScript}>
        Run Certora IDE
      </vscode-button>
    </div>
    <div class="command">
      <div class="command-description">
        Configurate script and smart contract settings.
      </div>
      <vscode-button class="command-button" on:click={openSettings}>
        Create Certora IDE conf file
      </vscode-button>
    </div>
  </div>
{:else}
  {#each verificationResults as vr (vr.contract + '-' + vr.spec)}
    <Pane
      title={vr.contract + '-' + vr.spec}
      initialExpandedState={true}
      actions={[
        {
          title: 'Remove Current Verification Result',
          icon: 'close',
          onClick: () => {
            verificationResults = verificationResults.filter(
              res => res.contract !== vr.contract && res.spec !== vr.spec,
            )
          },
        },
      ]}
    >
      <Tree
        data={{
          type: TreeType.Rules,
          tree: retrieveRules(vr.jobs),
        }}
        on:fetchOutput={e => newFetchOutput(e, vr)}
      />
    </Pane>
  {/each}
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
{/if}
<Pane title="Running Scripts" initialExpandedState={true}>
  {#if hasRunningScripts}
    <ul class="running-scripts">
      {#each runningScripts as script (script.pid)}
        <li>
          <RunningScript
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
        {#if hasResults}
          <vscode-button class="command-button" on:click={runScript}>
            Run Certora IDE
          </vscode-button>
        {/if}
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
