<script context="module">
  import { loadPosts } from '../../common/post-list-helpers';

  let oldestFilterIsSelected;
  let randomFilterIsSelected;
  let containsFilterIsSelected;
  let contains = '';

  export async function preload({ query = {} }, session) {
    const posts = await loadPosts(
      '/draft',
      new URLSearchParams(query),
      this.fetch
    );

    return {
      posts,
      oldestFilterIsSelected: query.oldest !== undefined,
      randomFilterIsSelected: false,
      containsFilterIsSelected: !!query.contains,
      contains: query.contains || '',
    };
  }
</script>

<script>
  export let posts;
  export let oldestFilterIsSelected;
  export let randomFilterIsSelected;
  export let containsFilterIsSelected;
  export let contains = '';

  import { pushHistory } from '../../common/post-list-helpers';

  import H2 from '../../document-components/H2.svelte';
  import H1 from '../../document-components/H1.svelte';
  import H3 from '../../document-components/H3.svelte';
  import PostListRow from '../../list-components/PostListRow.svelte';

  let responsePromise = Promise.resolve(posts);
  let totalPosts = posts.length;

  $: {
    responsePromise.then((p) => {
      totalPosts = p.length;
    });
  }

  function toggleOldestFilter() {
    oldestFilterIsSelected = !oldestFilterIsSelected;
    const updatedUrlSearchParams = pushHistory(
      'oldest',
      oldestFilterIsSelected
    );
    responsePromise = loadPosts(updatedUrlSearchParams);
  }
  function toggleRandomFilter() {
    /*TODO*/
  }
  let containsInputDomNode;
  function toggleContainsFilter() {
    contains = '';
    const updatedUrlSearchParams = pushHistory('contains', contains);
    containsFilterIsSelected = !containsFilterIsSelected;
    if (containsFilterIsSelected) {
      containsInputDomNode.focus();
    } else {
      responsePromise = loadPosts(updatedUrlSearchParams);
    }
  }
  function updateContains(e) {
    contains = e.target.value;
    pushHistory('contains', contains);
    const updatedUrlSearchParams = pushHistory('contains', contains);
    responsePromise = loadPosts(updatedUrlSearchParams);
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
  input {
    flex: 1;
    height: 38px;
    margin-right: 8px;
    transition: opacity 0.2s;
    opacity: 1;
    /* outline: var(--filbert-outline); */
    border: 1px solid var(--filbert-lightBlue);
    border-left: none;
    border-radius: 0 26px 26px 0;
  }
  input.hide {
    opacity: 0;
  }
  .with-input {
    flex-grow: 0;
    border: 1px solid transparent;
    border-right: none;
    margin-right: 0;
  }
  .with-input.open {
    border: 1px solid var(--accent-color-primary);
    border-right: none;
    margin-right: 0;
    border-top-right-radius: 0;
    border-bottom-right-radius: 0;
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
        on:click="{toggleOldestFilter}"
      >
        newest ⇩
      </button>
      <button
        class="filbert-nav-button"
        class:open="{oldestFilterIsSelected}"
        on:click="{toggleOldestFilter}"
      >
        oldest ⇧
      </button>
      <button
        class="filbert-nav-button"
        class:open="{randomFilterIsSelected}"
        on:click="{toggleRandomFilter}"
      >
        random ?
      </button>
    </div>
    <div class="filbert-col col-filter">
      <button
        class="filbert-nav-button with-input"
        class:open="{containsFilterIsSelected}"
        on:click="{toggleContainsFilter}"
      >
        contains
      </button>
      <input
        class:hide="{!containsFilterIsSelected}"
        on:input="{updateContains}"
        bind:this="{containsInputDomNode}"
        value="{contains}"
        name="contains"
        type="text"
      />
    </div>
  </div>
</div>
{#await responsePromise}
  <p class="filbert-section">...public</p>
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
  <p style="color: red">{error.message}</p>
{/await}
