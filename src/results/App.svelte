<script lang="ts">
  import Pane from './components/Pane.svelte'
</script>

<Pane
  title="Smart contract A"
  actions={[
    { title: 'Action1', icon: '\\ea60', onClick: () => console.log(123) },
    { title: 'Action2', icon: '\\ea97', onClick: () => console.log(456) },
  ]}
>
  <ul>
    <li>1</li>
    <li>2</li>
    <li>3</li>
    <li>4</li>
    <li>5</li>
  </ul>
</Pane>
<Pane title="Smart contract B" />
<Pane title="Call traces" />
<Pane title="Variables" />
<Pane title="Contract call resolution warnings" />
<Pane title="Contract call resolution" />

<style lang="postcss">
  :global(body) {
    padding: 0;
  }
</style>
