<script>
  /* ---------------------------------------------------------------------------------------------
   *  Component that shows a file item in the file picker
   *-------------------------------------------------------------------------------------------- */

  import { beforeUpdate, createEventDispatcher, onMount, tick } from 'svelte'
  import isOutOfViewport from 'svelte-select/src/utils/isOutOfViewport'
  import ItemComponent from './CustomItem.svelte'

  const dispatch = createEventDispatcher()
  let itemSrcHover = 'Full file path...'
  export let container = undefined
  export let VirtualList = null
  export let Item = ItemComponent
  export let isVirtualList = false
  export let items = []
  export let labelIdentifier = 'label'
  export let getOptionLabel = (option, filterText) => {
    if (option)
      return option.isCreator
        ? `Create \"${filterText}\"`
        : option[labelIdentifier]
  }
  export let getGroupHeaderLabel = null
  export let itemHeight = 40
  export let hoverItemIndex = 0
  export let value = undefined
  export let optionIdentifier = 'value'
  export let hideEmptyState = false
  export let noOptionsMessage = 'No options'
  export let isMulti = false
  export let activeItemIndex = 0
  export let filterText = ''
  export let parent = null
  export let listPlacement = null
  export let listAutoWidth = null
  export let listOffset = 5

  let isScrollingTimer = 0
  let isScrolling = false
  let prev_items

  onMount(() => {
    if (items.length > 0 && !isMulti && value) {
      const _hoverItemIndex = items.findIndex(
        item => item[optionIdentifier] === value[optionIdentifier],
      )

      if (_hoverItemIndex) {
        hoverItemIndex = _hoverItemIndex
      }
    }

    scrollToActiveItem('active')

    container.addEventListener(
      'scroll',
      () => {
        clearTimeout(isScrollingTimer)

        isScrollingTimer = setTimeout(() => {
          isScrolling = false
        }, 100)
      },
      false,
    )
  })

  beforeUpdate(() => {
    if (!items) items = []
    if (items !== prev_items && items.length > 0) {
      hoverItemIndex = 0
    }

    prev_items = items
  })

  function handleSelect(item) {
    if (item.isCreator) return
    dispatch('itemSelected', item)
  }

  function handleHover(i, item) {
    if (isScrolling) return
    hoverItemIndex = i
    itemSrcHover = item.path
  }

  function handleClick(args) {
    const { item, i, event } = args
    event.stopPropagation()

    if (value && !isMulti && value[optionIdentifier] === item[optionIdentifier])
      return closeList()

    if (item.isCreator) {
      dispatch('itemCreated', filterText)
    } else if (isItemSelectable(item)) {
      activeItemIndex = i
      hoverItemIndex = i
      handleSelect(item)
    }
  }

  function closeList() {
    dispatch('closeList')
  }

  async function updateHoverItem(increment) {
    if (isVirtualList) return

    let isNonSelectableItem = true

    while (isNonSelectableItem) {
      if (increment > 0 && hoverItemIndex === items.length - 1) {
        hoverItemIndex = 0
      } else if (increment < 0 && hoverItemIndex === 0) {
        hoverItemIndex = items.length - 1
      } else {
        hoverItemIndex = hoverItemIndex + increment
      }

      isNonSelectableItem = !isItemSelectable(items[hoverItemIndex])
      itemSrcHover = items[hoverItemIndex].path
    }

    await tick()

    scrollToActiveItem('hover')
  }

  function handleKeyDown(e) {
    switch (e.key) {
      case 'Escape':
        e.preventDefault()
        closeList()
        break
      case 'ArrowDown':
        e.preventDefault()
        items.length && updateHoverItem(1)
        break
      case 'ArrowUp':
        e.preventDefault()
        items.length && updateHoverItem(-1)
        break
      case 'Enter':
        e.preventDefault()
        if (items.length === 0) break
        const hoverItem = items[hoverItemIndex]
        if (
          value &&
          !isMulti &&
          value[optionIdentifier] === hoverItem[optionIdentifier]
        ) {
          closeList()
          break
        }
        if (hoverItem.isCreator) {
          dispatch('itemCreated', filterText)
        } else {
          activeItemIndex = hoverItemIndex
          handleSelect(items[hoverItemIndex])
        }
        break
      case 'Tab':
        e.preventDefault()
        if (items.length === 0) {
          return closeList()
        }
        if (
          value &&
          value[optionIdentifier] === items[hoverItemIndex][optionIdentifier]
        )
          return closeList()
        activeItemIndex = hoverItemIndex
        handleSelect(items[hoverItemIndex])
        break
    }
  }

  function scrollToActiveItem(className) {
    if (isVirtualList || !container) return

    let offsetBounding
    const focusedElemBounding = container.querySelector(
      `.listItem .${className}`,
    )

    if (focusedElemBounding) {
      offsetBounding =
        container.getBoundingClientRect().bottom -
        focusedElemBounding.getBoundingClientRect().bottom
    }

    container.scrollTop -= offsetBounding
  }

  function isItemActive(item, value, optionIdentifier) {
    return value && value[optionIdentifier] === item[optionIdentifier]
  }

  function isItemFirst(itemIndex) {
    return itemIndex === 0
  }

  function isItemHover(hoverItemIndex, item, itemIndex, items) {
    return (
      isItemSelectable(item) &&
      (hoverItemIndex === itemIndex || items.length === 1)
    )
  }

  function isItemSelectable(item) {
    return (
      (item.isGroupHeader && item.isSelectable) ||
      item.selectable ||
      !item.hasOwnProperty('selectable')
    ) // Default; if `selectable` was not specified, the object is selectable
  }

  let listStyle
  function computePlacement() {
    const { height, width } = parent.getBoundingClientRect()

    listStyle = ''
    listStyle += `min-width:${width}px;width:${
      listAutoWidth ? 'auto' : '100%'
    };`

    if (
      listPlacement === 'top' ||
      (listPlacement === 'auto' && isOutOfViewport(parent, container).bottom)
    ) {
      listStyle += `bottom:${height + listOffset}px;`
    } else {
      listStyle += `top:${height + listOffset}px;`
    }
  }

  $: {
    if (parent && container) computePlacement()
  }
</script>

<svelte:window on:keydown={handleKeyDown} on:resize={computePlacement} />

<div
  class="listContainer"
  class:virtualList={isVirtualList}
  bind:this={container}
  style={listStyle}
>
  {#if isVirtualList}
    <svelte:component this={VirtualList} {items} {itemHeight} let:item let:i>
      <div
        on:mouseover={() => handleHover(i, item)}
        on:focus={() => handleHover(i, item)}
        on:click={event => handleClick({ item, i, event })}
        class="listItem"
      >
        <svelte:component
          this={Item}
          {item}
          {filterText}
          {getOptionLabel}
          isFirst={isItemFirst(i)}
          isActive={isItemActive(item, value, optionIdentifier)}
          isHover={isItemHover(hoverItemIndex, item, i, items)}
          isSelectable={isItemSelectable(item)}
        />
      </div>
    </svelte:component>
  {:else}
    {#each items as item, i}
      {#if item.isGroupHeader && !item.isSelectable}
        <div class="listGroupTitle">{getGroupHeaderLabel(item)}</div>
      {:else}
        <div
          on:mouseover={() => handleHover(i, item)}
          on:focus={() => handleHover(i, item)}
          on:click={event => handleClick({ item, i, event })}
          class="listItem"
          tabindex="-1"
        >
          <svelte:component
            this={Item}
            {item}
            {filterText}
            {getOptionLabel}
            isFirst={isItemFirst(i)}
            isActive={isItemActive(item, value, optionIdentifier)}
            isHover={isItemHover(hoverItemIndex, item, i, items)}
            isSelectable={isItemSelectable(item)}
          />
        </div>
      {/if}
    {:else}
      {#if !hideEmptyState}
        <div class="empty">{noOptionsMessage}</div>
      {/if}
    {/each}
  {/if}

  <div class="showtxt">
    <span style="margin: 0; word-break: break-word;">
      {itemSrcHover}
    </span>
  </div>
</div>

<style>
  .listContainer {
    box-shadow: var(--listShadow, 0 2px 3px 0 rgba(44, 62, 80, 0.24));
    border-radius: var(--listBorderRadius, 4px);
    max-height: var(--listMaxHeight, 250px);
    overflow-y: auto;
    background: var(--listBackground, #fff);
    border: var(--listBorder, none);
    position: var(--listPosition, absolute);
    z-index: var(--listZIndex, 2);
    width: 100%;
    left: var(--listLeft, 0);
    right: var(--listRight, 0);
  }

  .virtualList {
    height: var(--virtualListHeight, 200px);
  }

  .listGroupTitle {
    color: var(--groupTitleColor, #8f8f8f);
    cursor: default;
    font-size: var(--groupTitleFontSize, 12px);
    font-weight: var(--groupTitleFontWeight, 600);
    height: var(--height, 42px);
    line-height: var(--height, 42px);
    padding: var(--groupTitlePadding, 0 20px);
    text-overflow: ellipsis;
    overflow-x: hidden;
    white-space: nowrap;
    text-transform: var(--groupTitleTextTransform);
  }

  .empty {
    text-align: var(--listEmptyTextAlign, center);
    padding: var(--listEmptyPadding, 20px 0);
    color: var(--listEmptyColor, #78848f);
  }

  .showtxt {
    box-sizing: border-box;
    position: sticky;
    background: var(--vscode-editorWidget-background);
    border: 1px solid var(--vscode-editorWidget-border);
    border-left: 0;
    /* border-right: 0; */
    left: 0;
    right: 0;
    bottom: 0;
    font-size: 11px;
    display: flex;
    flex-direction: column;
    width: 100%;
    text-align: left;
    padding: 8px;
    z-index: 3;
    overflow: hidden;
  }
</style>
