<script context="module">
  import { fromJS } from 'immutable';

  import { API_URL } from '../../common/constants';
  import { formatPostDate, reviver } from '../../common/utils';
  import { loading } from '../../stores';

  export function preload(page, session, preloading) {
    const { path, params, query } = page;
    loading.set(true);

    const responsePromise = this.fetch(`${API_URL}/post/${params.post}`)
        .then(response => response.json())
        .then(( { prevPost, nextPost, post, contentNodes } ) => {
          prevPost.published = formatPostDate(prevPost.published);
          nextPost.published = formatPostDate(nextPost.published);
          post.published = formatPostDate(post.published);
          return { post: fromJS(post), nodesById: fromJS(contentNodes, reviver), prevPost: fromJS(prevPost), nextPost: fromJS(nextPost) };
        })
        .finally(() => loading.set(false))

    return {
      responsePromise,
    };
  }
</script>

<script>
  export let responsePromise;

  import PostNext from '../../post-components/PostNext.svelte';
  import SiteInfo from '../../document-components/format-components/SiteInfo.svelte';
  import PostDetailsSection from '../../post-components/PostDetails.svelte';
  import PostAvatar from '../../post-components/PostAvatar.svelte';
  import Document from '../../document-components/Document.svelte';
</script>

<style>
  .prev-next-post-section {
    margin-bottom: 16px;
    max-width: var(--filbert-viewport9);
  }
  .thanks-for-reading-container {
    display: block;
    font-size: 32px;
    text-align: center;
    margin: 48px 0 32px 0;
  }
  .thanks-for-reading {
    letter-spacing: 0.6rem;
  }
</style>

{#await responsePromise}
  <p>...post</p>
{:then {post, nodesById, prevPost, nextPost}}
  <PostDetailsSection>
    <PostAvatar {post} showHandle />
  </PostDetailsSection>
  <Document nodesById={nodesById} />
  <div class="filbert-section prev-next-post-section">
    <SiteInfo shouldFormat>
      <div class="thanks-for-reading-container">
      <span class="thanks-for-reading">Thanks for reading</span>
      <span role="img" aria-label="peace sign">
    ✌🏼
    </span>
      </div>
    </SiteInfo>
    <div class="filbert-flex-grid">
      <PostNext post={prevPost} isPrevious />
      <PostNext post={nextPost} />
    </div>
  </div>
{:catch error}
  <p style="color: red">{error.message}</p>
{/await}