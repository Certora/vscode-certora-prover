<script>
  import { createEventDispatcher } from 'svelte'
  import collapse from 'svelte-collapse'
  import { resetNav } from '../stores/store.js'
  import Chevron from './Chevron.svelte'

  export let open = true
  export let duration = 0.2
  export let easing = 'ease'
  export let resetNavProp = false
  export let disabledState = false
  export let chevron = ''

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

<div
  class="card"
  class:open
  class:cursor_disabled={disabledState}
  aria-expanded={open}
>
  <div class="card-header" on:click={handleToggle} style={chevron}>
    <slot name="header" />
    <Chevron {open} />
  </div>

  <div class="card-body" use:collapse={{ open, duration, easing }}>
    <slot name="body" />
  </div>
</div>

<style>
  .card-header {
    cursor: pointer;
    user-select: none;
    display: flex;
  }

  .cursor_disabled,
  .cursor_disabled > .card-header {
    cursor: not-allowed;
  }
</style>
