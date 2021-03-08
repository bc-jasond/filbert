<script context="module">
  import { getApiClientInstance } from '../../common/api-client';
  import { formatPostDate } from '../../common/utils';
  import { loading } from '../../stores';

  // TODO: this double loads on the server and client rn
  export async function preload({ path, params, query }, session) {
    loading.set(true);

    const postRes = await getApiClientInstance(this.fetch).get(
      `/post/${params.post}`
    );
    const {
      error,
      data: { prevPost, nextPost, post, documentModel } = {},
    } = postRes;

    if (error) {
      this.error(error);
    }

    prevPost.published = formatPostDate(prevPost.published);
    nextPost.published = formatPostDate(nextPost.published);
    post.published = formatPostDate(post.published);

    return {
      post,
      documentModelData: documentModel,
      prevPost,
      nextPost,
    };
  }
</script>

<script>
  export let post;
  export let documentModelData;
  export let prevPost;
  export let nextPost;

  let postMap = Map();
  $: {
    postMap = fromJS(post);
    $currentPost = postMap;
  }
  $: documentModel = documentModelFromJS(documentModelData);
  $: prevPostMap = fromJS(prevPost);
  $: nextPostMap = fromJS(nextPost);

  import { fromJS, Map } from 'immutable';
  import { documentModelFromJS } from '@filbert/document';

  import { currentPost } from '../../stores';
  import PostNext from '../../post-components/PostNext.svelte';
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

<svelte:head>
  <title>filbert | {postMap.get('title')}</title>
</svelte:head>
<PostDetailsSection>
  <PostAvatar post="{postMap}" showHandle />
</PostDetailsSection>
<Document {documentModel} />
<div class="filbert-section prev-next-post-section">
  <span class="siteinfo-text" shouldFormat>
    <div class="thanks-for-reading-container">
      <span class="thanks-for-reading">Thanks for reading</span>
      <span role="img" aria-label="peace sign">✌🏼</span>
    </div>
  </span>
  <div class="filbert-flex-grid">
    <PostNext post="{prevPostMap}" isPrevious />
    <PostNext post="{nextPostMap}" />
  </div>
</div>
