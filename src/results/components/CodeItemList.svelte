<script lang="ts">
  /* ---------------------------------------------------------------------------------------------
   *  Component that shows results variables
   *-------------------------------------------------------------------------------------------- */

  import CodeItem from './CodeItem.svelte'
  import { variablesAdapter } from '../utils/variablesAdapter'
  import type { SourceVariable } from '../types'

  export let codeItems: SourceVariable[] = []
  export let pathToCode: string

  $: variables = codeItems.map(variablesAdapter)
</script>

<ul class="list">
  {#each variables as variable}
    <li>
      <CodeItem
        {pathToCode}
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
