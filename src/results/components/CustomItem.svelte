<script>
  /* ---------------------------------------------------------------------------------------------
   *  Component that shows a file list in the file picker
   *-------------------------------------------------------------------------------------------- */

  export let isActive = false
  export let isFirst = false
  export let isHover = false
  export let isSelectable = false
  export let getOptionLabel = undefined
  export let item = undefined
  export let filterText = ''

  let itemClasses = ''

  $: {
    const classes = []
    if (isActive) {
      classes.push('active')
    }
    if (isFirst) {
      classes.push('first')
    }
    if (isHover) {
      classes.push('hover')
    }
    if (item.isGroupHeader) {
      classes.push('groupHeader')
    }
    if (item.isGroupItem) {
      classes.push('groupItem')
    }
    if (!isSelectable) {
      classes.push('notSelectable')
    }
    itemClasses = classes.join(' ')
  }
</script>

<div class="item {itemClasses}" class:sticky={!item.value}>
  <span>
    {@html getOptionLabel(item, filterText)}
  </span>
  <span>
    {#if item.value !== 'Browse...'}
      {item.path}
    {:else}
      {item.path}
    {/if}
  </span>
</div>

<style>
  /* stylelint-disable */

  .item {
    cursor: pointer;
    height: 18px;
    line-height: 18px;
    /* height: var(--height, 18px);
        line-height: var(--height, 18px); */
    padding: var(--itemPadding, 0 20px);
    color: var(--itemColor, inherit);
    text-overflow: ellipsis;
    overflow: hidden;
    white-space: nowrap;
    display: flex;
    font-size: 12px;
  }
  .item span:last-child {
    margin-left: auto;
    font-size: 11px;
  }
  .item span:first-child {
    margin-right: 16px;
    margin-left: 4px;
  }

  .groupHeader {
    text-transform: var(--groupTitleTextTransform);
  }

  .groupItem {
    padding-left: var(--groupItemPaddingLeft, 40px);
  }

  .item:active {
    background: var(--itemActiveBackground, #b9daff);
  }

  .item.active {
    background: var(--itemIsActiveBG, #007aff);
    color: var(--itemIsActiveColor, #fff);
  }

  .item.notSelectable {
    color: var(--itemIsNotSelectableColor, #999);
  }

  .item.first {
    border-radius: var(--itemFirstBorderRadius, 4px 4px 0 0);
  }

  .item.hover:not(.active) {
    background: var(--itemHoverBG, #e7f2ff);
    color: var(--itemHoverColor, inherit);
  }

  .sticky {
  }

  :global(.listItem:first-of-type, .listItem:first-of-type .item.first) {
    position: sticky;
    top: 0;
    z-index: 1;
    background: var(--vscode-button-background);
    color: var(--vscode-button-foreground);
  }
  :global(.listItem:first-of-type:hover, .listItem:first-of-type
      .item.first.hover) {
    background: var(--button-primary-hover-background);
    color: var(--vscode-button-foreground);
  }
</style>
