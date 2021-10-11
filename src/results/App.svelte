<script lang="ts">
  import Pane from './components/Pane.svelte'
  import CodeItemList from './components/CodeItemList.svelte'
  import Tree from './components/Tree.svelte'
  import type { Tree as TreeJson, Output } from './types'
  import { TreeType } from './types'

  import allStatusesTree from './mocks/all-statuses-tree.json'
  import output from './mocks/output1.json'

  const typedTree = allStatusesTree as TreeJson
  const typedOutput = output as Output
</script>

<Pane title={typedTree.contract}>
  <Tree
    data={{
      type: TreeType.Rules,
      tree: typedTree.rules,
    }}
  />
</Pane>
<Pane title="Call traces">
  <Tree
    data={{
      type: TreeType.Calltrace,
      tree: typedOutput.callTrace || [],
    }}
  />
</Pane>
<Pane title="Variables">
  <CodeItemList
    codeItems={[
      {
        name: 'certoraCond19969',
        value: 'ce4604a0000000000000000000000016',
        selected: false,
      },
      {
        name: 'CollateralTokenInfoTokenAddress(6)',
        value: 'ce4604a0000000000000000000000016',
        selected: true,
      },
      {
        name: 'certoraCond19969',
        value: 'true',
        selected: false,
      },
      {
        name: 'certoraCond19969',
        value: '0',
        selected: false,
      },
      {
        name: 'certoraCond19969',
        value: '1',
        selected: false,
      },
    ]}
  />
</Pane>
<Pane title="Contract call resolution warnings" />
<Pane title="Contract call resolution" />

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
