<script context="module">
  import { formatPostDate } from '../../common/utils';
  import { getApiClientInstance } from '../../common/api-client';
  import { loading } from '../../stores';

  let oldestFilterIsSelected;
  let randomFilterIsSelected;
  let usernameFilterIsSelected;
  let username = '';

  function pushHistory(param, value) {
    const urlSearchParams = new URLSearchParams(window.location.search);
    if (value) {
      urlSearchParams.set(param, value === true ? '' : value);
    } else {
      urlSearchParams.delete(param);
    }
    const updatedQueryString =
      urlSearchParams.toString().length > 0
        ? `?${urlSearchParams.toString()}`
        : '';
    // update the URL in history for the user to retain
    window.history.pushState(
      {},
      document.title,
      `${window.location.pathname}${updatedQueryString}`
    );
    return urlSearchParams;
  }

  async function loadPosts(urlSearchParams, fetchClient) {
    loading.set(true);
    const apiClient = getApiClientInstance(fetchClient)
    const params = urlSearchParams.toString();
    const queryString = params.length > 0 ? `?${params}` : '';
    const { error, data: postsData } = await apiClient.get(
      `/post${queryString}`
    );
    loading.set(false);
    return postsData.map((post) => ({
      ...post,
      published: formatPostDate(post.published),
      updated: formatPostDate(post.updated),
    }));
  }

  // TODO: this loads on both server and client every time, it needs to be redesigned
  //  so that sapper (devalue) can tell that the data has been loaded
  export async function preload({query = {}}, session) {
    console.log("POST LIST PRELOAD")
    const posts = await loadPosts(new URLSearchParams(query), this.fetch);

    return {
      posts,
      oldestFilterIsSelected: query.oldest !== undefined,
      randomFilterIsSelected: false,
      usernameFilterIsSelected: !!query.username,
      username: query.username || '',
    };
  }
</script>

<script>
  export let posts;
  export let oldestFilterIsSelected;
  export let randomFilterIsSelected;
  export let usernameFilterIsSelected;
  export let username = '';

  import H2 from '../../document-components/H2.svelte';
  import H1 from '../../document-components/H1.svelte';
  import H3 from '../../document-components/H3.svelte';
  import PostListRow from '../../post-components/PostListRow.svelte';

  let responsePromise = Promise.resolve(posts)
  let totalPosts = posts.length;

  $: {
    responsePromise.then(p => {
      totalPosts = p.length;
    })
  }

  function toggleOldestFilter() {
    oldestFilterIsSelected = !oldestFilterIsSelected;
    const updatedUrlSearchParams = pushHistory('oldest', oldestFilterIsSelected);
    responsePromise = loadPosts(updatedUrlSearchParams);
  }
  function toggleRandomFilter() {
    /*TODO*/
  }
  let usernameInputDomNode;
  function toggleUsernameFilter() {
    username = '';
    const updatedUrlSearchParams = pushHistory('username', username);
    usernameFilterIsSelected = !usernameFilterIsSelected;
    if (usernameFilterIsSelected) {
      usernameInputDomNode.focus();
    } else {
      responsePromise = loadPosts(updatedUrlSearchParams);
    }
  }
  function updateUsername(e) {
    username = e.target.value;
    pushHistory('username', username);
    const updatedUrlSearchParams = pushHistory('username', username);
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

<div class="base-row">
  <H1>Public Articles ({totalPosts})</H1>
  <H3 fontWeightNormal>
    These pieces have been published{' '}
    <span role="img" aria-label="stack of books">📚</span>
    {' '} and are viewable by everyone on the World Wide Web{' '}
    <span role="img" aria-label="globe">🌍</span>
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
        class:open="{usernameFilterIsSelected}"
        on:click="{toggleUsernameFilter}"
      >
        username @
      </button>
      <input
        class:hide="{!usernameFilterIsSelected}"
        on:input="{updateUsername}"
        bind:this="{usernameInputDomNode}"
        value="{username}"
        name="username"
        type="text"
        autoComplete="off"
        minlength="5"
        maxlength="42"
      />
    </div>
  </div>
</div>
{#await responsePromise}
  <p>...public</p>
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
