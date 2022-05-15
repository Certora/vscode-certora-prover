<script lang="ts">
  import BaseSetting from './BaseSetting.svelte'

  export let title: string
  export let description: string
  export let value: string

  function onChange(
    e: Event & {
      currentTarget: EventTarget & HTMLInputElement
    },
  ) {
    value = e.currentTarget.value
  }
</script>

<BaseSetting {title} {description}>
  <vscode-text-field class="vscode-text-field" {value} on:change={onChange} />
</BaseSetting>

<style>
  .vscode-text-field {
    width: 250px;
  }
</style>
