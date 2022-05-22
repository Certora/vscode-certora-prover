<script lang="ts">
  import BaseSetting from './BaseSetting.svelte'

  export let title: string
  export let description: string
  export let value: string
  export let mandatory: boolean = false

  function onChange(
    e: Event & {
      currentTarget: EventTarget & HTMLInputElement
    },
  ) {
    value = e.currentTarget.value
  }
</script>

<BaseSetting {title} {description} {mandatory}>
  <vscode-text-field {value} on:change={onChange} />
</BaseSetting>
