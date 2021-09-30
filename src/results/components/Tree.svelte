<script lang="ts">
  import TreeItem from './TreeItem.svelte'

  import type { TreeItem as TreeItemType } from '../types'

  export let data: TreeItemType[]
</script>

<div class="tree">
  {#each data as item, i}
    <TreeItem
      {item}
      setsize={data.length}
      posinset={i + 1}
      actions={[
        { title: 'Action1', icon: '\\ea60', onClick: () => console.log(123) },
      ]}
    />
  {/each}
</div>

<style>
  .tree {
    position: relative;
    transform: translate3d(0px, 0px, 0px);
    overflow: hidden;
    left: 0;
    top: 0;
    user-select: none;
  }
</style>
