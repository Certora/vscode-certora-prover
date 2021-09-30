<script lang="ts">
  export let title: string
  export let icon: string
</script>

<li class="action-item menu-entry" role="presentation">
  <a
    class="action-label codicon codicon-action codicon-{icon}"
    role="button"
    {title}
    tabindex="0"
    on:click|preventDefault|stopPropagation
  />
</li>

<style lang="postcss">
  .action-item {
    margin-right: 4px;
    display: block;
    align-items: center;
    justify-content: center;
    cursor: pointer;
    position: relative;
  }

  .action-label {
    display: flex;
    align-items: center;
    width: 16px;
    height: 16px;
    padding: 2px;
    border-radius: 5px;
    text-decoration: none;
    color: #424242;

    &:focus {
      outline-color: rgba(255, 255, 255, 0);
    }

    &:active {
      outline: 0 !important;
    }

    &:hover {
      background-color: rgba(184, 184, 184, 0.31);
    }
  }
</style>
