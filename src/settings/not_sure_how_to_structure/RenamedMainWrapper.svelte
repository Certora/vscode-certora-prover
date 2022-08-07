<script>
  import Test from './Test.svelte'
</script>

<div class="main_wrapper">
  <div class="left_wrapper"><h1>test heading</h1></div>
  <div class="right_wrapper"><Test /></div>
</div>

<style>
  /* stylelint-disable */

  .main_wrapper {
    display: flex;
  }
  .left_wrapper {
    width: 30%;
    border-right: 1px solid var(--vscode-sideBarSectionHeader-border);
    padding: 24px;
  }
  .right_wrapper {
    width: 70%;
    padding: 24px;
  }
</style>
