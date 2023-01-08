<script lang="ts">
  /* ---------------------------------------------------------------------------------------------
   *  Component that shows one action button for the Toolbar component
   *-------------------------------------------------------------------------------------------- */

  export let title: string
  export let icon: string
  export let link: string = ''
  export let disabled = false
</script>

<li class="action-item menu-entry" role="presentation">
  {#if link}
    <a
      class="action-label {disabled
        ? 'disabled'
        : 'active-link'} codicon codicon-action codicon-{icon}"
      {title}
      role="button"
      href={link}
      tabindex="0"
    />
  {:else}
    <div
      class="action-label {disabled
        ? 'disabled'
        : 'active'} codicon codicon-action codicon-{icon} "
      role="button"
      {title}
      tabindex="0"
      on:click|preventDefault|stopPropagation
    />
  {/if}
</li>

<style lang="postcss">
  .action-item {
    position: relative;
    display: block;
    align-items: center;
    justify-content: center;
    margin-right: 4px;
  }

  .action-label {
    display: flex;
    width: 16px;
    height: 16px;
    align-items: center;
    padding: 2px;
    border-radius: 5px;
    text-decoration: none;
    color: var(--code-item-value-color);

    &:focus {
      outline-color: rgb(255 255 255 / 0%);
    }

    &:active {
      outline: 0 !important;
    }
  }

  .active {
    cursor: pointer;
    &:hover {
      background-color: rgb(184 184 184 / 31%);
    }
  }

  .active-link {
    cursor: pointer;
    color: #1abcfe;
    &:hover {
      background-color: rgb(184 184 184 / 31%);
    }
  }

  .disabled {
    color: var(--vscode-disabledForeground) !important;
    cursor: default !important;
  }
</style>
