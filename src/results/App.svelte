<script lang="ts">
  import Pane from './components/Pane.svelte'
  import CodeItemList from './components/CodeItemList.svelte'
  import Tree from './components/Tree.svelte'
  import type { Tree as TreeJson, Assert, Output } from './types'
  import { TreeType } from './types'

  import treeForDynamicUI from './mocks/tree-for-dynamic-ui.json'
  import output0 from './mocks/output0.json'
  import output1 from './mocks/output1.json'

  let tree = treeForDynamicUI as TreeJson
  let selectedAssert: Assert

  const outputs = {
    'output0.json': output0,
    'output1.json': output1,
  }

  function selectAssert(e: CustomEvent<Assert>) {
    selectedAssert = e.detail
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
    {#if output.variables}
      <Pane title={`${output.name} variables`}>
        <CodeItemList codeItems={output.variables} />
      </Pane>
    {/if}
    {#if output.callTrace}
      <Pane title={`Call traces`}>
        <Tree
          data={{
            type: TreeType.Calltrace,
            tree: output.callTrace,
          }}
          on:selectAssert={selectAssert}
        />
      </Pane>
    {/if}
    {#if output.callResolutionWarnings}
      <Pane title={`Contract call resolution warnings`}>
        <CodeItemList codeItems={[]} />
      </Pane>
    {/if}
    {#if output.callResolution}
      <Pane title={`Contract call resolution`}>
        <CodeItemList codeItems={[]} />
      </Pane>
    {/if}
  {/await}
{/if}

<style lang="postcss">
  :global(body) {
    padding: 0;
  }

  :global(body.vscode-light) {
    --code-item-name-color: #00f;
    --code-item-value-color: #454545;
    --code-item-value-background-color: #f0f0f0;
    --code-item-background-color-selected: #0060c0;
    --code-item-background-color-hover: #f0f0f0;
  }

  :global(body.vscode-dark) {
    --code-item-name-color: #7cb9eb;
    --code-item-value-color: #ccc;
    --code-item-value-background-color: #37373d;
    --code-item-background-color-selected: #094771;
    --code-item-background-color-hover: #37373d;
  }
</style>
