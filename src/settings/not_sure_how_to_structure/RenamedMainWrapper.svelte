<script>
  import RunSideNav from './RunSideNav.svelte'
  import SpecSettingsTab from './SpecSettingsTab.svelte'
  import Test from './Test.svelte'
  import VerificationMessageTab from './VerificationMessageTab.svelte'
</script>

<div class="main_wrapper">
  <div class="left_wrapper media"><RunSideNav /></div>
  <div class="right_wrapper">
    <div class="top_nav"><RunSideNav /></div>
    <Test />
    <SpecSettingsTab />
    <VerificationMessageTab />
  </div>
</div>

<style>
  /* stylelint-disable */
  .top_nav {
    display: none;
  }
  .main_wrapper {
    display: flex;
    box-sizing: border-box;
    height: 100vh;
    overflow: hidden;
    /* width: 100%; */
    /* overflow: hidden; */
  }
  .left_wrapper {
    box-sizing: border-box;
    width: 30%;
    border-right: 1px solid var(--vscode-sideBarSectionHeader-border);
    padding: 16px;
  }
  .right_wrapper {
    box-sizing: border-box;
    width: 70%;
    padding: 16px;
    overflow-y: scroll;
    overflow-x: hidden;
  }
  .right_wrapper::-webkit-scrollbar {
    display: none;
  }
  @media (max-width: 820px) {
    .media {
      display: none;
    }
    .right_wrapper {
      width: 100%;
      padding: 0;
    }
    .top_nav {
      display: block;
    }

    :global(body) {
      padding: 16px;
      overflow-x: hidden;
    }
  }
</style>
