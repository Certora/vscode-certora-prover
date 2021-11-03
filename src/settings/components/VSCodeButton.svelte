<script lang="ts">
  export let isSmall: boolean = false
  export let title: string
  export let icon: string = ''
</script>

<vscode-button class:small={isSmall} on:click>
  {title}
  {#if icon}
    <span slot="start" class="codicon codicon-{icon}" />
  {/if}
</vscode-button>

<style>
  vscode-button.small {
    --button-padding-vertical: 1px;
    --button-padding-horizontal: 16px;
  }
</style>
