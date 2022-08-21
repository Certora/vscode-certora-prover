<script>
  export let placeholder = 'placeholder'
  export let bindValue
  export let change
</script>

<div>
  <input
    class="simple_txt_input"
    type="text"
    bind:value={bindValue}
    on:input={change}
    on:change={change}
    {placeholder}
  />
  {#if bindValue !== ''}
    <span
      class="clr_input"
      on:click={() => {
        bindValue = ''
        change()
      }}
    >
      <i class="codicon codicon-close" />
      <!-- <svg
        xmlns="http://www.w3.org/2000/svg"
        width="16"
        height="16"
        viewBox="0 0 16 16"
        fill="none"
      >
        <path
          d="M8 8.69333L11.6267 12.3733L12.3733 11.6267L8.69333 8L12.3733 4.37333L11.6267 3.62667L8 7.30667L4.37333 3.62667L3.62667 4.37333L7.30667 8L3.62667 11.6267L4.37333 12.3733L8 8.69333Z"
          fill="#2D505F"
        />
      </svg> -->
    </span>
  {/if}
</div>

<style>
  /* stylelint-disable */

  div {
    position: relative;
  }
  .clr_input {
    position: absolute;
    right: 4px;
    top: 50%;
    transform: translateY(-50%);
  }
  input {
    width: -webkit-fill-available;
  }
  i {
    color: var(--dropdown-text-color);
  }
</style>
