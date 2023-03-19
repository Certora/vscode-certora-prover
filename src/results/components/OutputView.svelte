<script lang="ts">
  import { CallTraceFunction, JobList, Output, TreeType } from '../types'
  import CodeItemList from './CodeItemList.svelte'
  import ContractCallResolution from './ContractCallResolution.svelte'
  import Pane from './Pane.svelte'
  import Tree from './Tree.svelte'

  // todo: output should match current job list
  export let output: Output
  export let selectedCalltraceFunction: CallTraceFunction
  export let jobList: JobList

  function selectCalltraceFunction(e: CustomEvent<CallTraceFunction>) {
    selectedCalltraceFunction = e.detail
  }

  function clearOutput() {
    if (output) output = undefined
    if (selectedCalltraceFunction) selectedCalltraceFunction = undefined
  }
</script>

{#if output}
  {#if output.variables && output.variables.length > 0}
    <Pane
      title={`${output.treeViewPath.ruleName} variables`}
      jobListPath={jobList.dirPath}
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
    <Pane title={`CALL TRACE`} jobListPath={jobList.dirPath}>
      <Tree
        runDisplayName=""
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
      jobListPath={jobList.dirPath}
    >
      <CodeItemList codeItems={selectedCalltraceFunction.variables} />
    </Pane>
  {/if}
  {#if output.callResolutionWarnings && output.callResolutionWarnings.length > 0}
    <Pane
      title={`Contract call resolution warnings`}
      jobListPath={jobList.dirPath}
    >
      {#each output.callResolutionWarnings as resolution}
        <ContractCallResolution contractCallResolution={resolution} />
      {/each}
    </Pane>
  {/if}
  {#if output.callResolution && output.callResolution.length > 0}
    <Pane title={`Contract call resolution`} jobListPath={jobList.dirPath}>
      {#each output.callResolution as resolution}
        <ContractCallResolution contractCallResolution={resolution} />
      {/each}
    </Pane>
  {/if}
{/if}
