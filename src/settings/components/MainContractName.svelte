<script lang="ts">
  import Setting from './Setting.svelte'

  export let mainContractName: string
</script>

<Setting title="Main Contract Name" description="Contract name">
  <vscode-text-field on:change={e => (mainContractName = e.target.value)} />
</Setting>
