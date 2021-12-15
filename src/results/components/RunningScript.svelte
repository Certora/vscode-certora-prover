<script lang="ts">
  import { getIconPath } from '../utils/getIconPath'

  export let confFile: string
</script>

<div class="running-script">
  <div class="name">
    <img
      class="running-icon"
      width="16"
      height="16"
      src={getIconPath('running-rule-status.svg')}
      alt=""
    />
    <span title={confFile}>{confFile}</span>
  </div>
  <div
    tabindex="0"
    role="button"
    aria-label="Stop script"
    title="Stop script"
    class="stop codicon codicon-stop-circle"
    on:click
  />
</div>

<style lang="postcss">
  .running-script {
    display: flex;
    height: 23px;
    align-items: center;
    justify-content: space-between;
    padding-right: 14px;
    padding-left: 16px;
  }

  .name {
    display: flex;
    min-width: 0;
    flex: 1;
    align-items: center;
    font-size: 13px;
    line-height: 16px;

    > span {
      overflow: hidden;
      text-overflow: ellipsis;
      white-space: nowrap;
    }
  }

  .running-icon {
    margin-right: 7px;
  }

  .stop {
    margin-left: 7px;
    cursor: pointer;
  }
</style>
