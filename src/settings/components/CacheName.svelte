<script lang="ts">
  import Setting from './Setting.svelte'

  export let cacheName: string
</script>

<Setting
  title="Cache name"
  description="Optimize the pre-analysis by using cache"
>
  <vscode-text-field on:change={e => (cacheName = e.target.value)} />
</Setting>
