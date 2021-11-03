<script lang="ts">
  import Setting from './Setting.svelte'

  export let message: string
</script>

<Setting
  title="Message"
  description="Adds a message description to your run, similar to a commit message. This message will appear in the title of the completion email sent to you"
>
  <vscode-text-field on:change={e => (message = e.target.value)} />
</Setting>
