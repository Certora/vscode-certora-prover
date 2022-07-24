<script>
  import { createEventDispatcher } from 'svelte'
  import collapse from 'svelte-collapse'
  import { resetNav } from '../stores/store.js'

  export let open = true
  export let duration = 0.2
  export let easing = 'ease'
  export let resetNavProp = false
  export let disabledState = false
  const dispatch = createEventDispatcher()
  function handleToggle() {
    if (disabledState) return
    if (resetNavProp) {
      resetNav()
    }
    open = !open
    if (open) {
      dispatch('open')
    } else {
      dispatch('close')
    }
  }
</script>

<div class="card" class:open aria-expanded={open}>
  <div class="card-header" on:click={handleToggle}>
    <slot name="header" />
  </div>

  <div class="card-body" use:collapse={{ open, duration, easing }}>
    <slot name="body" />
  </div>
</div>

<style>
  .card-header {
    cursor: pointer;
    user-select: none;
  }
</style>
