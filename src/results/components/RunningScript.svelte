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
    <span>{confFile}</span>
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
    justify-content: space-between;
    align-items: center;
    padding-left: 16px;
    padding-right: 2px;
  }

  .name {
    display: flex;
    align-items: center;
    flex: 1;
    min-width: 0;
    font-size: 13px;
    line-height: 16px;

    > span {
      white-space: nowrap;
      overflow: hidden;
      text-overflow: ellipsis;
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
