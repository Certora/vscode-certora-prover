<script lang="ts">
  import Pane from './components/Pane.svelte'
  import CodeItemList from './components/CodeItemList.svelte'
  import Tree from './components/Tree.svelte'
  import ContractCallResolution from './components/ContractCallResolution.svelte'
  import type { Tree as TreeJson, Assert, Output } from './types'
  import { TreeType, CallTraceFunction } from './types'

  import treeForDynamicUI from './mocks/tree-for-dynamic-ui.json'
  import output0 from './mocks/output0.json'
  import output1 from './mocks/output1.json'

  let tree = treeForDynamicUI as TreeJson
  let selectedAssert: Assert
  let selectedCalltraceFunction: CallTraceFunction

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
</script>

<Pane title={treeForDynamicUI.contract}>
  <Tree
    data={{
      type: TreeType.Rules,
      tree: tree.rules,
    }}
    on:selectAssert={selectAssert}
  />
</Pane>

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
</style>
