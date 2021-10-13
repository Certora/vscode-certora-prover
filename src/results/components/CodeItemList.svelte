<script lang="ts">
  import CodeItem from './CodeItem.svelte'
  import type { JumpToDefinition } from '../types'

  export let codeItems: {
    [x: string]: string | boolean | JumpToDefinition[]
  }[] = []
</script>

<ul class="list">
  {#each codeItems as codeItem}
    {#each Object.keys(codeItem) as varName}
      {#if varName !== 'jumpToDefinition'}
        <li>
          <CodeItem
            name={varName}
            value={codeItem[varName]}
            jumpToDefinition={codeItem.jumpToDefinition}
          />
        </li>
      {/if}
    {/each}
  {/each}
</ul>

<style>
  .list {
    padding: 0;
    margin: 0;
    list-style-type: none;
  }
</style>
