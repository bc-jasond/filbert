<script context="module">
  import { loadPosts } from '../../common/post-list-helpers';

  export async function preload({ query = {} }, session) {
    if (!session.user) {
      this.error(404, 'Not found');
      return;
    }

    const posts = await loadPosts(
      '/draft',
      new URLSearchParams(query),
      this.fetch
    );

    return {
      posts,
      oldestFilterIsSelected: query.oldest !== undefined,
      randomFilterIsSelected: false,
      contains: query.contains || '',
    };
  }
</script>

<script>
  export let posts;
  export let oldestFilterIsSelected;
  export let randomFilterIsSelected;
  export let contains = '';

  import { pushHistory } from '../../common/post-list-helpers';
  import { isBrowser } from '../../common/utils';

  import H2 from '../../document-components/H2.svelte';
  import H1 from '../../document-components/H1.svelte';
  import H3 from '../../document-components/H3.svelte';
  import PostListRow from '../../list-components/PostListRow.svelte';
  import Spinner from '../../icons/Spinner.svelte';
  import FilterWithInput from '../../list-components/FilterWithInput.svelte';

  let responsePromise = Promise.resolve(posts);
  let totalPosts = posts.length;

  $: {
    responsePromise.then((p) => {
      totalPosts = p.length;
    });
  }

  // react to toggle contains filter or contains input
  $: {
    if (isBrowser()) {
      const updatedUrlSearchParams = pushHistory('contains', contains);
      responsePromise = loadPosts('/draft', updatedUrlSearchParams);
    }
  }
  // toggle oldest / newest filter
  $: {
    if (isBrowser()) {
      const updatedUrlSearchParams = pushHistory(
        'oldest',
        oldestFilterIsSelected
      );
      responsePromise = loadPosts('/draft', updatedUrlSearchParams);
    }
  }
</script>

<style>
  .base-row {
    max-width: var(--filbert-viewport7);
    padding: 16px 0;
    border-top: 1px solid var(--background-color-secondary);
    word-wrap: break-word;
    word-break: break-word;
  }
  .base-row:first-of-type {
    border: none;
    padding-top: 0;
  }
  .base-row:last-of-type {
    margin-bottom: 42px;
  }
  .loader-row {
    display: flex;
    align-items: center;
    justify-content: center;
    padding: 48px;
  }
  .col-filter {
    display: flex;
    padding-bottom: 16px;
    white-space: nowrap;
  }
  .col-filter:last-of-type {
    padding-bottom: 0;
  }
  button {
    display: inline-block;
    padding: 9px;
    margin-left: 8px;
  }
  button:first-of-type {
    margin-left: 0;
  }

  @media (min-width: 768px) {
    .base-row {
      margin: 0 auto;
    }
  }
  @media (min-width: 992px) {
    .col-filter:last-of-type {
      padding-bottom: 16px;
    }
  }
</style>

<svelte:head>
  <title>filbert | private work</title>
</svelte:head>

<div class="base-row">
  <H1>My Private Work ({totalPosts})</H1>
  <H3 fontWeightNormal>
    These pieces have{' '}
    <span role="img" aria-label="lock">🔒</span>
    {' '} NOT been published{' '}
    <span role="img" aria-label="lock">🔑</span>
    {' '} and are only viewable{' '}
    <span role="img" aria-label="eyeballs">👀</span>
    {' '} by you while logged into{' '}
    <span role="img" aria-label="hand writing with a pen">✍️</span>
    {' '} filbert
  </H3>
</div>
<div class="base-row">
  <H2>Filter by:</H2>
  <div class="filbert-flex-grid">
    <div class="filbert-col col-filter">
      <button
        class="filbert-nav-button"
        class:open="{!oldestFilterIsSelected}"
        on:click="{() => (oldestFilterIsSelected = !oldestFilterIsSelected)}"
      >
        newest ⇩
      </button>
      <button
        class="filbert-nav-button"
        class:open="{oldestFilterIsSelected}"
        on:click="{() => (oldestFilterIsSelected = !oldestFilterIsSelected)}"
      >
        oldest ⇧
      </button>
      <button
        class="filbert-nav-button"
        class:open="{randomFilterIsSelected}"
        on:click="{() => {}}"
      >
        random ?
      </button>
    </div>
    <div class="filbert-col col-filter">
      <FilterWithInput
        name="contains"
        buttonLabel="contains"
        bind:value="{contains}"
      />
    </div>
  </div>
</div>
{#await responsePromise}
  <div class="base-row loader-row">
    <Spinner loading dark />
  </div>
{:then posts}
  {#if posts && !posts.length}
    <div class="base-row">
      <h3 class="filbert-section heading-link">
        <span role="img" aria-label="crying face">😢</span>
        {' '} Nada. 没有. Rien. ничего. Nothing. ナッシング...
      </h3>
    </div>
  {/if}
  {#each posts as post}
    <PostListRow {post} />
  {/each}
{:catch error}
  <div class="base-row">
    <p style="color: red">{error.message}</p>
  </div>
{/await}
