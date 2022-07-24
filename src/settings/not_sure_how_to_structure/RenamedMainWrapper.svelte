<script>
  import RunSideNav from './RunSideNav.svelte'
  import SpecSettingsTab from './SpecSettingsTab.svelte'
  import Test from './Test.svelte'
  import VerificationMessageTab from './VerificationMessageTab.svelte'
</script>

<div class="main_wrapper">
  <div class="left_wrapper"><RunSideNav /></div>
  <div class="right_wrapper">
    <Test />
    <SpecSettingsTab />
    <VerificationMessageTab />
  </div>
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
