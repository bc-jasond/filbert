<script context="module">
  import { fromJS } from 'immutable';

  import { API_URL } from '../../common/constants';
  import { formatPostDate } from '../../common/utils';
  import { loading } from '../../stores';

  export function preload(page, session, preloading) {
    const { path, params, query } = page;
    loading.set(true);

    const responsePromise = this.fetch(`${API_URL}/post`)
        .then(response => response.json())
        .then(postsData => {
          return {
            posts: postsData.map((post) => fromJS({
              ...post,
              published: formatPostDate(post.published),
              updated: formatPostDate(post.updated),
            }))
          }
        })
        .finally(() => loading.set(false))

    return {
      responsePromise,
    };
  }
</script>

<script>
  export let responsePromise;

  import H2 from '../../document-components/H2.svelte';
  import H1 from '../../document-components/H1.svelte';
  import H3 from '../../document-components/H3.svelte';
  import PostListRow from '../../post-components/PostListRow.svelte';

  let oldestFilterIsSelected;
  function toggleOldestFilter() {
    oldestFilterIsSelected = !oldestFilterIsSelected;
  }
  let randomFilterIsSelected;
  function toggleRandomFilter() {}
  let usernameFilterIsSelected;
  let usernameInputDomNode;
  function toggleUsernameFilter() {
    username = '';
    usernameFilterIsSelected = !usernameFilterIsSelected;
    if (usernameFilterIsSelected) {
      usernameInputDomNode.focus();
    }
  }
  let username = '';
  function updateUsername(e) {
    username = e.target.value;
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

{#await responsePromise}
  <p>...public</p>
{:then {posts}}
<div class="base-row">
  <H1>Public Articles</H1>
  <H3 fontWeightNormal>
    These pieces have been published{' '}
    <span role="img" aria-label="stack of books">
                      📚
                    </span>{' '}
    and are viewable by everyone on the World Wide Web{' '}
    <span role="img" aria-label="globe">
                      🌍
                    </span>
  </H3>
</div>
<div class="base-row">
  <H2 fontWeightNormal>Filter by:</H2>
  <div class="filbert-flex-grid">
    <div class="filbert-col col-filter">
      <button class="filbert-nav-button" class:open={!oldestFilterIsSelected} on:click={toggleOldestFilter}>
        newest ⇩
      </button>
      <button class="filbert-nav-button" class:open={oldestFilterIsSelected} on:click={toggleOldestFilter}>
        oldest ⇧
      </button>
      <button class="filbert-nav-button" class:open={randomFilterIsSelected} on:click={toggleRandomFilter}>
        random ?
      </button>
    </div>
    <div class="filbert-col col-filter">
      <button class="filbert-nav-button with-input" class:open={usernameFilterIsSelected} on:click={toggleUsernameFilter}>username @</button>
      <input
          class:hide={!usernameFilterIsSelected}
          on:input={updateUsername}
          bind:this={usernameInputDomNode}
          value={username}
          name="username"
          type="text"
          autoComplete="off"
          minLength="5"
          maxLength="42"
      />
    </div>
  </div>
</div>
  {#each posts as post}
    <PostListRow {post} />
  {/each}
{:catch error}
  <p style="color: red">{error.message}</p>
{/await}