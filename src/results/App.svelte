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
  import { mergeResults } from './utils/mergeResults'
  import type { Assert, Output, Job, EventsFromExtension, Rule } from './types'
  import { TreeType, CallTraceFunction, EventTypesFromExtension } from './types'

  let output: Output
  let selectedCalltraceFunction: CallTraceFunction

  let results: Job[] = []
  let runningScripts: { pid: number; confFile: string }[] = []

  $: hasRunningScripts = runningScripts.length > 0
  $: hasResults = results.length > 0

  function fetchOutput(e: CustomEvent<Assert | Rule>, job: Job) {
    if (!e.detail.output) return

    const outputUrl = `${job.progressUrl.replace(
      'progress',
      'result',
    )}&output=${e.detail.output}`

    getOutput(outputUrl)
  }

  function selectCalltraceFunction(e: CustomEvent<CallTraceFunction>) {
    selectedCalltraceFunction = e.detail
  }

  const listener = (e: MessageEvent<EventsFromExtension>) => {
    switch (e.data.type) {
      case EventTypesFromExtension.ReceiveNewJobResult: {
        results = mergeResults(results, e.data.payload)
        break
      }
      case EventTypesFromExtension.RunningScriptChanged: {
        runningScripts = e.data.payload
        break
      }
      case EventTypesFromExtension.SetOutput: {
        output = e.data.payload
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
</script>

{#if !hasResults}
  <div class="zero-state">
    <div class="command">
      <div class="command-description">
        To check you smart contract start Certora IDE tool in command palette or
        with button.
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
  {#each results as job}
    <Pane title={job.verificationProgress.contract} initialExpandedState={true}>
      <Tree
        data={{
          type: TreeType.Rules,
          tree: job.verificationProgress.rules,
        }}
        on:fetchOutput={e => fetchOutput(e, job)}
      />
    </Pane>
  {/each}
  {#if output}
    {#if output.variables && output.variables.length > 0}
      <Pane title={`${output.name} variables`} initialExpandedState={true}>
        <CodeItemList codeItems={output.variables} />
      </Pane>
    {/if}
    {#if output.callTrace && output.callTrace.length > 0}
      <Pane title={`Call traces`} initialExpandedState={true}>
        <Tree
          data={{
            type: TreeType.Calltrace,
            tree: output.callTrace,
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
  {/if}
</Pane>

<style lang="postcss">
  :global(body) {
    padding: 0;
  }

  :global(:root) {
    --monospace-font: Consolas, Menlo, 'Courier New', monospace;
  }

  :global(body.vscode-light) {
    --code-item-name-color: #00f;
    --code-item-value-color: #454545;
    --code-item-value-background-color: #e4e6f1;
    --code-item-background-color-selected: #0060c0;
    --code-item-background-color-hover: #e4e6f1;
    --pane-border-color: rgba(97, 97, 97, 0.19);
  }

  :global(body.vscode-dark) {
    --code-item-name-color: #7cb9eb;
    --code-item-value-color: #ccc;
    --code-item-value-background-color: #37373d;
    --code-item-background-color-selected: #094771;
    --code-item-background-color-hover: #37373d;
    --pane-border-color: rgba(204, 204, 204, 0.2);
  }

  .zero-state {
    padding: 0 15px 0 24px;

    .command {
      margin-bottom: 27px;
    }

    .command-description {
      font-size: 13px;
      line-height: 16px;
      margin-bottom: 8px;
    }

    .command-button {
      width: 100%;
    }
  }

  .running-scripts {
    margin: 0;
    padding: 0;
    list-style-type: none;
  }
</style>
