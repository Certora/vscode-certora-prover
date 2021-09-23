<script lang="ts">
  import CodeItem from './CodeItem.svelte'

  export let codeItems: { name: string; value: string; selected: boolean }[] =
    []
</script>

<ul class="list">
  {#each codeItems as codeItem}
    <li>
      <CodeItem
        name={codeItem.name}
        value={codeItem.value}
        selected={codeItem.selected}
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
