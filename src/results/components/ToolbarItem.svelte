<script lang="ts">
  export let title: string
  export let icon: string
</script>

<li class="action-item menu-entry" role="presentation">
  <div
    class="action-label codicon codicon-action codicon-{icon}"
    role="button"
    {title}
    tabindex="0"
    on:click|preventDefault|stopPropagation
  />
</li>

<style lang="postcss">
  .action-item {
    position: relative;
    display: block;
    align-items: center;
    justify-content: center;
    margin-right: 4px;
    cursor: pointer;
  }

  .action-label {
    display: flex;
    width: 16px;
    height: 16px;
    align-items: center;
    padding: 2px;
    border-radius: 5px;
    text-decoration: none;

    &:focus {
      outline-color: rgb(255 255 255 / 0%);
    }

    &:active {
      outline: 0 !important;
    }

    &:hover {
      background-color: rgb(184 184 184 / 31%);
    }
  }
</style>
