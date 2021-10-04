<script lang="ts">
  import Pane from './components/Pane.svelte'
  import CodeItemList from './components/CodeItemList.svelte'
  import Tree from './components/Tree.svelte'
  import certoraScriptOutput1 from './mocks/certora-script-output-example-1.json'
  import certoraScriptOutput2 from './mocks/certora-script-output-example-2.json'
  import certoraScriptOutput3 from './mocks/certora-script-output-example-3.json'
  import certoraScriptOutput4 from './mocks/certora-script-output-example-4.json'
  import type { RuleTree, Rule, RuleTreeItem, CallTraceFunction } from './types'

  const outputs = [
    certoraScriptOutput1,
    certoraScriptOutput2,
    certoraScriptOutput3,
    certoraScriptOutput4,
  ] as Rule[]

  const createRuleTree = (data: Rule[]): RuleTree => {
    const hashTable = Object.create(null)

    const allParentRules = Array.from(
      new Set(data.map(rule => rule.parent_rule).filter(Boolean)),
    )
    const emptyRules = new Set()

    data.forEach(rule => {
      if (!allParentRules.includes(rule.name) && rule.parent_rule) {
        emptyRules.add(rule.parent_rule)
      }
    })

    const dataWithEmptyRules: Rule[] = [
      ...data,
      ...Array.from(emptyRules).map((rule: string) => ({ name: rule })),
    ]

    dataWithEmptyRules.forEach(rule => {
      hashTable[rule.name] = { ...rule, childrenList: [] }
    })
    const dataTree: RuleTree = []
    dataWithEmptyRules.forEach(rule => {
      if (rule.parent_rule) {
        hashTable[rule.parent_rule].childrenList.push(hashTable[rule.name])
      } else {
        dataTree.push(hashTable[rule.name])
      }
    })

    function setAssertMessage(node: RuleTreeItem) {
      if (node.assertMessage) {
        node.childrenList?.push({
          name: node.assertMessage[0],
          isAssertMessageNode: true,
          result: node.result,
        })
      }

      node.childrenList?.forEach((node: RuleTreeItem) => {
        setAssertMessage(node)
      })
    }

    dataTree.forEach(treeItem => {
      setAssertMessage(treeItem)
    })

    return dataTree
  }

  const tree = createRuleTree(outputs)
  const calltrace = certoraScriptOutput1.callTrace as CallTraceFunction[]
</script>

<Pane title="Rules">
  <Tree
    data={{
      type: 'rules',
      tree,
    }}
  />
</Pane>
<Pane title="Call traces">
  <Tree
    data={{
      type: 'callstack',
      tree: calltrace,
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
