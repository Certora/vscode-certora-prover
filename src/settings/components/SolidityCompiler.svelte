<script lang="ts">
  import Setting from './Setting.svelte'

  export let solidityCompiler: string
</script>

<Setting
  title="Solidity compiler"
  description="Solidity compiler executable file (expected to be added to the $PATH environment variable). By default, solc (or solc.exe on Windows) is used"
>
  <vscode-text-field on:change={e => (solidityCompiler = e.target.value)} />
</Setting>
