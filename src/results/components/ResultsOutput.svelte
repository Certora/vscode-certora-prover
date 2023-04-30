<script lang="ts">
  import { onDestroy, onMount } from 'svelte'
  import {
    CallTraceFunction,
    EventTypesFromExtension,
    EventsFromExtension,
    TreeType,
  } from '../types'
  import CodeItemList from './CodeItemList.svelte'
  import ContractCallResolution from './ContractCallResolution.svelte'
  import Pane from './Pane.svelte'
  import Tree from './Tree.svelte'
  import { Sources, log } from '../utils/log'
  import { verificationResults } from '../store/store'

  export let output
  export let selectedCalltraceFunction
  export let pathToCode

  function selectCalltraceFunction(e: CustomEvent<CallTraceFunction>) {
    selectedCalltraceFunction = e.detail
  }

  function clearOutput() {
    if (output) output = undefined
    if (selectedCalltraceFunction) selectedCalltraceFunction = undefined
  }

  const listener = (e: MessageEvent<EventsFromExtension>) => {
    switch (e.data.type) {
      case EventTypesFromExtension.ClearAllJobs: {
        log({
          action: 'Received "clear-all-jobs" command',
          source: Sources.ResultsWebview,
          info: {
            current$verificationResults: $verificationResults,
          },
        })
        if ($verificationResults.length) $verificationResults = []
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
</script>

{#if output}
  {#if output.variables && output.variables.length}
    <Pane
      title={`${output.treeViewPath.ruleName} variables`}
      actions={[
        {
          title: 'Close Output',
          icon: 'close',
          onClick: clearOutput,
        },
      ]}
    >
      <CodeItemList codeItems={output.variables} {pathToCode} />
    </Pane>
  {/if}
  {#if output.callTrace && Object.keys(output.callTrace).length}
    <Pane title={`CALL TRACE`}>
      <Tree
        {pathToCode}
        data={{
          type: TreeType.Calltrace,
          tree: [output.callTrace],
        }}
        on:selectCalltraceFunction={selectCalltraceFunction}
      />
    </Pane>
  {/if}
  {#if selectedCalltraceFunction && selectedCalltraceFunction.variables && selectedCalltraceFunction.variables.length}
    <Pane title={`${selectedCalltraceFunction.name} variables`}>
      <CodeItemList
        codeItems={selectedCalltraceFunction.variables}
        {pathToCode}
      />
    </Pane>
  {/if}
  {#if output.callResolutionWarnings && output.callResolutionWarnings.length}
    <Pane title={`Contract call resolution warnings`}>
      {#each output.callResolutionWarnings as resolution}
        <ContractCallResolution
          contractCallResolution={resolution}
          {pathToCode}
        />
      {/each}
    </Pane>
  {/if}
  {#if output.callResolution && output.callResolution.length}
    <Pane title={`Contract call resolution`}>
      {#each output.callResolution as resolution}
        <ContractCallResolution
          contractCallResolution={resolution}
          {pathToCode}
        />
      {/each}
    </Pane>
  {/if}
{/if}
