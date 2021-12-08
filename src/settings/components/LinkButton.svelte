<script lang="ts">
  export let title: string
  export let icon: string
  export let red: boolean = false
</script>

<div class="button" role="button" on:click>
  <span class:red class="icon codicon codicon-{icon}" />
  <span class:red class="title">{title}</span>
</div>

<style>
  .button {
    display: inline-flex;
    align-items: center;
    font-weight: 500;
    cursor: pointer;
  }

  .red {
    color: #eb5757;
  }

  .icon {
    margin-right: 4px;
  }

  .title {
    text-decoration: underline;
  }
</style>
