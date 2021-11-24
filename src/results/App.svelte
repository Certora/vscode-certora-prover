<script lang="ts">
  import { onMount, onDestroy } from 'svelte'
  import uniqBy from 'lodash.uniqby'
  import Pane from './components/Pane.svelte'
  import CodeItemList from './components/CodeItemList.svelte'
  import Tree from './components/Tree.svelte'
  import ContractCallResolution from './components/ContractCallResolution.svelte'
  import RunningScript from './components/RunningScript.svelte'
  import type {
    Assert,
    Output,
    Job,
    Tree as TreeJson,
    EventsFromExtension,
  } from './types'
  import { TreeType, CallTraceFunction, EventTypesFromExtension } from './types'

  import output0 from './mocks/output0.json'
  import output1 from './mocks/output1.json'

  let selectedAssert: Assert
  let selectedCalltraceFunction: CallTraceFunction

  let results: Job[] = []
  let runningScripts: { pid: number; confFile: string }[] = []

  $: hasRunningScripts = runningScripts.length > 0

  const outputs = {
    'output0.json': output0,
    'output1.json': output1,
  }

  function selectAssert(e: CustomEvent<Assert>) {
    selectedAssert = e.detail
  }

  function selectCalltraceFunction(e: CustomEvent<CallTraceFunction>) {
    selectedCalltraceFunction = e.detail
  }

  async function getOutput(assert: Assert): Promise<Output> {
    return outputs[assert.output]
  }

  const listener = (e: MessageEvent<EventsFromExtension>) => {
    switch (e.data.type) {
      case EventTypesFromExtension.ReceiveNewJobResult: {
        results = uniqBy(
          [
            ...results,
            {
              ...e.data.payload,
              verificationProgress: JSON.parse(
                e.data.payload.verificationProgress,
              ) as TreeJson,
            },
          ],
          job => job.verificationProgress.contract,
        )
        break
      }
      case EventTypesFromExtension.RunningScriptChanged: {
        runningScripts = e.data.payload
      }
      default:
        break
    }
  }

  function stopScript(pid: number) {
    vscode.postMessage({
      command: 'stop-script',
      payload: pid,
    })
  }

  onMount(() => {
    window.addEventListener('message', listener)
  })

  onDestroy(() => {
    window.removeEventListener('message', listener)
  })
</script>

{#each results as job}
  <Pane title={job.verificationProgress.contract}>
    <Tree
      data={{
        type: TreeType.Rules,
        tree: job.verificationProgress.rules,
      }}
      on:selectAssert={selectAssert}
    />
  </Pane>
{/each}

{#if selectedAssert}
  {#await getOutput(selectedAssert) then output}
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
  {/await}
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

  .running-scripts {
    margin: 0;
    padding: 0;
    list-style-type: none;
  }
</style>
