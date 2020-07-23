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

  import PostListRow from '../../post-components/PostListRow.svelte';
</script>

{#await responsePromise}
  <p>...public</p>
{:then {posts}}
  {#each posts as post}
    <PostListRow {post} />
  {/each}
{:catch error}
  <p style="color: red">{error.message}</p>
{/await}