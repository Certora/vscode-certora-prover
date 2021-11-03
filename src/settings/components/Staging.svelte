<script lang="ts">
  import Setting from './Setting.svelte'

  export let useStaging: boolean
  export let branch: string
</script>

<Setting title="Staging">
  <div class="staging">
    <vscode-checkbox
      checked={useStaging}
      on:change={e => (useStaging = e.target.checked)}
    >
      Run on the Staging Environment
    </vscode-checkbox>
    <vscode-text-field
      disabled={!useStaging}
      value={branch}
      on:change={e => (branch = e.target.value)}
    >
      Branch name
    </vscode-text-field>
  </div>
</Setting>

<style>
  .staging {
    display: flex;
    flex-direction: column;
    align-items: flex-start;
    gap: 9px;
  }
</style>
