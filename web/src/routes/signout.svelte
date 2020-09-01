<script context="module">
  import { getApiClientInstance } from '../common/api-client';

  export async function preload(page, session) {
    const { error } = await getApiClientInstance(this.fetch).post('/signout');

    return { error };
  }
</script>

<script>
  import { onMount } from 'svelte';
  import { stores } from '@sapper/app';
  import { GoogleAuth } from '../stores';
  import { googleAuth } from '../common/google-auth';

  import H1 from '../document-components/H1.svelte';

  const { session } = stores();

  let error;

  onMount(async () => {
    if (!error) {
      await $GoogleAuth.signOut();
      // refresh GoogleAuth instance
      $GoogleAuth = await googleAuth();
      session.set({});
    }
  });
</script>

<style>
  div {
    margin-top: 20vh;
    text-align: center;
    display: flex;
    align-items: center;
    justify-content: center;
  }
  .bigger {
    font-size: 72px;
  }
</style>

<svelte:head>
  <title>filbert | signout</title>
</svelte:head>

<div>
  <H1>
    <span class="bigger">
      {#if error}
        Signout failed, refresh the page
      {:else}
        You're logged out
        <span role="img" aria-label="hand waving bye">👋</span>
      {/if}
    </span>
  </H1>
</div>
