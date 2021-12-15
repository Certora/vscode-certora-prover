<script lang="ts">
  import { nanoid } from 'nanoid'
  import BaseSetting from './BaseSetting.svelte'
  import LinkButton from './LinkButton.svelte'
  import VsCodeButton from './VSCodeButton.svelte'
  import type { AdditionalSetting } from '../types'

  export let settings: AdditionalSetting[]

  const cliWikiLink =
    'https://certora.atlassian.net/wiki/spaces/CPD/pages/7340043/Certora+Prover+CLI+Options'
</script>

<BaseSetting
  title="Additional Settings"
  description="If a flag is given with no value, it is treated as a boolean and set to true"
>
  <div class="settings">
    {#each settings as setting, index (setting.id)}
      <div class="settings-fields">
        <vscode-text-field on:change={e => (setting.option = e.target.value)}>
          Option (flag)
        </vscode-text-field>
        <vscode-text-field on:change={e => (setting.value = e.target.value)}>
          Value (optional)
        </vscode-text-field>
      </div>
      {#if index !== 0}
        <LinkButton
          title="Delete flag"
          icon="trash"
          red
          on:click={() =>
            (settings = settings.filter(({ id }) => id !== setting.id))}
        />
      {/if}
    {/each}
  </div>
  <VsCodeButton
    title="Add flag"
    icon="add"
    isSmall
    on:click={() =>
      (settings = [
        ...settings,
        {
          id: nanoid(),
          option: '',
          value: '',
        },
      ])}
  />
  <p class="info">
    Full list with advanced settings:&nbsp;<vscode-link href={cliWikiLink}
      >Certora Prover CLI Options</vscode-link
    >
  </p>
</BaseSetting>

<style>
  .settings {
    display: flex;
    flex-direction: column;
    margin-bottom: var(--space-md);
    gap: var(--space-md);
  }

  .settings-fields {
    display: flex;
    gap: var(--space-md);
  }

  .info {
    display: flex;
    align-items: center;
    margin-top: var(--space-md);
    margin-bottom: var(--space-xl);
  }
</style>
