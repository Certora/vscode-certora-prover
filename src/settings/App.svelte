<script lang="ts">
  import { onMount, onDestroy } from 'svelte'
  import { nanoid } from 'nanoid'
  import MainSolidityFile from './components/MainSolidityFile.svelte'
  import MainContractName from './components/MainContractName.svelte'
  import SpecFile from './components/SpecFile.svelte'
  import SolidityCompiler from './components/SolidityCompiler.svelte'
  import VerifyAdditionalContract from './components/VerifyAdditionalContract.svelte'
  import Link from './components/Link.svelte'
  import ExtendedSettings from './components/ExtendedSettings.svelte'
  import Staging from './components/Staging.svelte'
  import CacheName from './components/CacheName.svelte'
  import Message from './components/Message.svelte'
  import AdditionalSettings from './components/AdditionalSettings.svelte'
  import type { Form } from './types'

  let sol: string[] = []
  let spec: string[] = []
  let form: Form = {
    mainSolidityFile: '',
    mainContractName: '',
    specFile: '',
    solidityCompiler: '',
    useAdditionalContracts: false,
    additionalContracts: sol.map(file => ({ file, name: '' })),
    link: [
      {
        id: nanoid(),
        contractName: '',
        fieldName: '',
        associatedContractName: '',
      },
    ],
    extendedSettings: [{ id: nanoid(), flag: '' }],
    useStaging: true,
    branch: 'master',
    cacheName: '',
    message: '',
    additionalSettings: [
      {
        id: nanoid(),
        option: '',
        value: '',
      },
    ],
  }

  const fileListener = (
    e: MessageEvent<{
      type: string
      payload: { sol: string[]; spec: string[] }
    }>,
  ) => {
    if (e.data.type === 'smart-contracts-files-updated') {
      sol = e.data.payload.sol
      spec = e.data.payload.spec
    }
  }

  function createConfFile() {
    vscode.postMessage({
      command: 'create-conf-file',
      payload: form,
    })
  }

  onMount(() => {
    window.addEventListener('message', fileListener)
  })

  onDestroy(() => {
    window.removeEventListener('message', fileListener)
  })
</script>

<div class="settings">
  <h2 class="title">General</h2>
  <MainSolidityFile {sol} bind:mainSolidityFile={form.mainSolidityFile} />
  <MainContractName bind:mainContractName={form.mainContractName} />
  <SpecFile {spec} bind:specFile={form.specFile} />
  <SolidityCompiler bind:solidityCompiler={form.solidityCompiler} />
  <VerifyAdditionalContract
    {sol}
    bind:useAdditionalContracts={form.useAdditionalContracts}
    bind:additionalContracts={form.additionalContracts}
  />
  <Link
    useAdditionalContracts={form.useAdditionalContracts}
    bind:link={form.link}
  />
  <h2 class="title">Advanced</h2>
  <ExtendedSettings bind:flags={form.extendedSettings} />
  <Staging bind:useStaging={form.useStaging} bind:branch={form.branch} />
  <CacheName bind:cacheName={form.cacheName} />
  <Message bind:message={form.message} />
  <AdditionalSettings bind:settings={form.additionalSettings} />
  <div>
    <vscode-button on:click={createConfFile}>Create conf file</vscode-button>
  </div>
</div>

<style lang="postcss">
  :global(body) {
    padding: 26px 24px;
  }

  :global(body.vscode-light) {
    --dropdown-text-color: #000;
  }

  :global(body.vscode-dark) {
    --dropdown-text-color: var(--dropdown-foreground);
  }

  :global(vscode-dropdown) {
    color: var(--dropdown-text-color);
  }

  .settings {
    display: flex;
    flex-direction: column;
    gap: 26px;
  }

  .title {
    font-weight: 600;
    font-size: 26px;
    line-height: 31px;
    margin-top: 0;
    margin-bottom: -8px; /* because we have `gap: 26px;` in settings */
  }
</style>
