<script lang="ts">
  import CodeItem from './CodeItem.svelte'
  import { variablesAdapter } from '../utils/variablesAdapter'
  import type { SourceVariable } from '../types'

  export let codeItems: SourceVariable[] = []

  $: variables = codeItems.map(variablesAdapter)
</script>

<ul class="list">
  {#each variables as variable}
    <li>
      <CodeItem
        name={variable.name}
        value={variable.value}
        jumpToDefinition={variable.jumpToDefinition}
      />
    </li>
  {/each}
</ul>

<style>
  .list {
    padding: 0;
    margin: 0;
    list-style-type: none;
  }
</style>
