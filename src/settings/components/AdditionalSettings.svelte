<script lang="ts">
  import { nanoid } from 'nanoid'
  import Setting from './Setting.svelte'
  import LinkButton from './LinkButton.svelte'
  import VsCodeButton from './VSCodeButton.svelte'
  import type { AdditionalSetting } from '../types'

  export let settings: AdditionalSetting[]
</script>

<Setting
  title="Additional settings"
  description="If a flag is given with no value, it is treated as a boolean and set to true"
>
  <div class="settings">
    {#each settings as setting, index (setting.id)}
      <vscode-text-field on:change={e => (setting.option = e.target.value)}>
        Option (flag)
      </vscode-text-field>
      <vscode-text-field on:change={e => (setting.value = e.target.value)}>
        Value (optional)
      </vscode-text-field>
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
    Full list with advanced settings:&nbsp;<vscode-link
      href="https://certora.atlassian.net/wiki/spaces/CPD/pages/7340043/Certora+Prover+CLI+Options"
      >Certora Prover CLI Options</vscode-link
    >
  </p>
</Setting>

<style>
  .settings {
    display: flex;
    flex-direction: column;
    align-items: flex-start;
    gap: 14px;
    margin-bottom: 14px;
  }

  .info {
    display: flex;
    align-items: center;
    margin-top: 14px;
    margin-bottom: 26px;
  }
</style>
