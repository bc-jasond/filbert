<script context="module">
  import { fromJS } from 'immutable';

  import { API_URL } from '../../common/constants';
  import { formatPostDate } from '../../common/utils';
  import { loading } from '../../stores';

  export async function preload(page, session, preloading) {
    const { path, params, query } = page;
    loading.set(true);
    const response = await this.fetch(`${API_URL}/post`)
    const postsData = await response.json();
    loading.set(false);
    return {
      posts: postsData.map((post) => fromJS({
            ...post,
            published: formatPostDate(post.published),
            updated: formatPostDate(post.updated),
          })
      )
    };
  }
</script>

<script>
  // export let routeInfo;
  // export let session;
  export let posts;

  import PostListRow from '../../post-components/PostListRow.svelte';
</script>

<style>

</style>

{#each posts as post}
  <PostListRow {post} />
{/each}
