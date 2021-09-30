<script lang="ts">
  import Pane from './components/Pane.svelte'
  import CodeItemList from './components/CodeItemList.svelte'
  import Tree from './components/Tree.svelte'
  import certoraScriptOutput from './mocks/certora-script-output.json'
</script>

<Pane
  title="Smart contract A"
  actions={[
    { title: 'Action1', icon: 'add', onClick: () => console.log(123) },
    { title: 'Action2', icon: 'activate-breakpoints', onClick: () => console.log(456) },
  ]}
/>
<Pane title="Smart contract B" />
<Pane title="Call traces">
  <Tree data={certoraScriptOutput.callTrace} />
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
