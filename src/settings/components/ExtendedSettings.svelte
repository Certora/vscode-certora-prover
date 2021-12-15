<script lang="ts">
  import { nanoid } from 'nanoid'
  import BaseSetting from './BaseSetting.svelte'
  import LinkButton from './LinkButton.svelte'
  import VsCodeButton from './VSCodeButton.svelte'
  import type { Flag } from '../types'

  export let flags: Flag[]
</script>

<BaseSetting
  title="Extended Settings"
  description="Specify special flags in the following format (-flag[=value])"
>
  <div class="flags">
    {#each flags as flag, index (flag.id)}
      <vscode-text-field on:change={e => (flag.flag = e.target.value)}>
        Option (-flag[=value])
      </vscode-text-field>
      {#if index !== 0}
        <LinkButton
          title="Delete flag"
          icon="trash"
          red
          on:click={() => (flags = flags.filter(({ id }) => id !== flag.id))}
        />
      {/if}
    {/each}
  </div>
  <VsCodeButton
    title="Add flag"
    icon="add"
    isSmall
    on:click={() =>
      (flags = [
        ...flags,
        {
          id: nanoid(),
          flag: '',
        },
      ])}
  />
</BaseSetting>

<style>
  .flags {
    display: flex;
    flex-direction: column;
    align-items: flex-start;
    margin-bottom: var(--space-lg);
    gap: var(--space-lg);
  }
</style>
