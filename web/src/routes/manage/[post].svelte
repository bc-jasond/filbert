<script context="module">
  import { getApiClientInstance } from '../../common/api-client';

  export async function preload({ params: { post: postId } }, session) {
    const {
      error: errorPost,
      data: { post },
    } = await getApiClientInstance(this.fetch).get(`/manage/${postId}`);
    if (errorPost) {
      console.error(errorPost);
    }

    const {
      error: errorPostSummary,
      data: postSummary,
    } = await getApiClientInstance(this.fetch).get(`/post-summary/${postId}`);
    if (errorPostSummary) {
      console.error(errorPostSummary);
    }
    return {
      post,
      postSummary,
    };
  }
</script>

<script>
  export let post;
  export let postSummary;

  import { Map, fromJS } from 'immutable';
  import { goto } from '@sapper/app';
  import { onMount } from 'svelte';

  import { POST_ACTION_REDIRECT_TIMEOUT } from '@filbert/constants';
  import { formatPostDate } from '../../common/utils';

  import H1 from '../../document-components/H1.svelte';
  import H2 from '../../document-components/H2.svelte';
  import Image from '../../document-components/Image.svelte';
  import Toggle from '../../form-components/Toggle.svelte';
  import ButtonSpinner from '../../form-components/ButtonSpinner.svelte';

  let nextUrl;
  let focusAndScroll;
  let backupTitle;
  let backupAbstract;
  let backupImageNode;
  let lastSavedPostMap = Map();
  onMount(async () => {
    const { focusAndScrollSmooth, getNextFromUrl } = await import(
      '../../common/dom'
    );
    nextUrl = getNextFromUrl();
    focusAndScroll = focusAndScrollSmooth;
    backupTitle = postMap.get('title', '');
    backupAbstract = postMap.get('abstract', '');
    backupImageNode = postMap.getIn(['meta', 'imageNode']) || Map();
    lastSavedPostMap = postMap;
  });

  $: postMap = fromJS(post);
  $: postSummaryMap = fromJS(postSummary);
  $: shouldSyncTitleAndAbstract = postMap.getIn([
    'meta',
    'syncTitleAndAbstract',
  ]);
  $: shouldSyncTopPhoto = postMap.getIn(['meta', 'syncTopPhoto']);
  $: imageNode = shouldSyncTopPhoto
    ? postSummaryMap.get('imageNode', Map())
    : postMap.getIn(['meta', 'imageNode'], Map());

  $: shouldWarnForUnsaved = !lastSavedPostMap.equals(postMap);

  let inputDomNode;
  let errorObj = {};
  let imageIsSelected;
  const imageContainerId = 'manage-post-image-container';
  let shouldShowSuccessMessage = false;
  let saveLoading;

  function syncTitleAndAbstract(postLocal, postSummaryLocal) {
    const current = postLocal.getIn(['meta', 'syncTitleAndAbstract']);
    if (current) {
      return postLocal
        .set('title', postSummaryLocal.get('title'))
        .set('abstract', postSummaryLocal.get('abstract'));
    }
    return postLocal.set('title', backupTitle).set('abstract', backupAbstract);
  }

  function syncImage(postLocal, postSummaryLocal) {
    const current = postLocal.getIn(['meta', 'syncTopPhoto']);
    if (current) {
      return postLocal.setIn(
        ['meta', 'imageNode'],
        postSummaryLocal.get('imageNode')
      );
    }
    return backupImageNode.size
      ? postLocal.setIn(['meta', 'imageNode'], backupImageNode)
      : postLocal;
  }

  function toggleTitleAndAbstract() {
    const current = postMap.getIn(['meta', 'syncTitleAndAbstract']);
    let updatedPost = postMap.setIn(['meta', 'syncTitleAndAbstract'], !current);
    updatedPost = syncTitleAndAbstract(updatedPost, postSummaryMap);
    updatePost(updatedPost);
  }
  function toggleImage() {
    const current = postMap.getIn(['meta', 'syncTopPhoto']);
    let updatedPost = postMap.setIn(['meta', 'syncTopPhoto'], !current);
    updatedPost = syncImage(updatedPost, postSummaryMap);
    updatePost(updatedPost);
  }
  async function savePost() {
    saveLoading = true;
    const { error } = await getApiClientInstance().patch(
      `/post/${postMap.get('id')}`,
      {
        title: postMap.get('title'),
        canonical: postMap.get('canonical'),
        abstract: postMap.get('abstract'),
        meta: postMap.get('meta'),
      }
    );
    lastSavedPostMap = postMap;
    saveLoading = false;
    if (error) {
      shouldShowSuccessMessage = false;
      errorObj = error;
      return { error };
    }
    shouldShowSuccessMessage = true;
    errorObj = {};
    setTimeout(() => {
      shouldShowSuccessMessage = false;
    }, POST_ACTION_REDIRECT_TIMEOUT);
    return {};
  }
  function publishPost() {}
  function duplicatePost() {}
  function deletePost() {}

  function updatePost(postLocal) {
    postMap = postLocal;
    errorObj = {};
    shouldShowSuccessMessage = false;
  }
</script>

<style>
  .filbert-input-container {
    display: flex;
    flex-direction: column;
    opacity: 1;
    transition: opacity 0.125s ease-out;
    margin-bottom: 16px;
  }
  .filbert-input-container.hide {
    opacity: 0.4;
  }
  .filbert-input-container.image {
    display: block;
  }
  .middle-wrapper {
    width: 100%;
    margin: 0;
    padding: 0;
  }
  .toggle-wrapper {
    padding: 0 16px 8px;
  }
  .toggle-label {
    flex-grow: 2;
    font-family: var(--code-font-family), monospaced;
    color: var(--filbert-grey);
    font-size: 18px;
    line-height: 24px;
  }
  .message-container {
    min-height: 36px;
    margin-bottom: 8px;
    text-align: center;
    font-family: var(--code-font-family);
    display: flex;
    align-items: center;
    justify-content: center;
  }
  .success {
    color: var(--filbert-success);
  }
  .error {
    color: var(--filbert-error);
  }
  .filbert-flex-grid {
    margin-bottom: 16px;
  }
  .filbert-col-9 {
    margin-right: 0;
  }
  @media (min-width: 768px) {
    .middle-wrapper {
      width: 75%;
      margin: 0 auto;
      padding: 0 20px 40px 20px;
    }
  }
  @media (min-width: 992px) {
    .filbert-col-9 {
      margin-right: 8px;
    }
  }
  @media (min-width: 1200px) {
    .middle-wrapper {
      width: 60%;
    }
  }
</style>

<H1>Manage{postMap.get('published') ? ' Post' : ' Draft'}</H1>
<H2>Edit Listing Details, Publish, Duplicate & Delete</H2>
<div class="filbert-flex-grid">
  <div class="filbert-col">
    <div
      class="filbert-input-container"
      class:hide="{shouldSyncTitleAndAbstract}"
    >
      <label htmlFor="title" class:error="{errorObj.title}">title</label>
      <input
        name="title"
        type="text"
        value="{postMap.get('title')}"
        disabled="{shouldSyncTitleAndAbstract}"
        on:input="{(e) => {
          updatePost(postMap.set('title', e.target.value));
        }}"
        class:error="{errorObj.title}"
        bind:this="{inputDomNode}"
      />
    </div>
    <div
      class="filbert-input-container"
      class:hide="{postMap.get('published')}"
    >
      <label htmlFor="canonical" class:error="{errorObj.canonical}">
        canonical
      </label>
      <input
        name="canonical"
        type="text"
        value="{postMap.get('canonical')}"
        disabled="{postMap.get('published')}"
        on:input="{(e) => {
          updatePost(postMap.set('canonical', e.target.value));
        }}"
        class:error="{errorObj.canonical}"
      />
    </div>
    <div
      class="filbert-input-container"
      class:hide="{shouldSyncTitleAndAbstract}"
    >
      <label htmlFor="abstract" class:error="{errorObj.abstract}">
        abstract
      </label>
      <textarea
        name="abstract"
        type="text"
        value="{postMap.get('abstract')}"
        disabled="{shouldSyncTitleAndAbstract}"
        on:input="{(e) => {
          updatePost(postMap.set('abstract', e.target.value));
        }}"
        class:error="{errorObj.abstract}"
      ></textarea>
    </div>
  </div>
  <div class="filbert-col">
    <div
      id="{imageContainerId}"
      class="filbert-input-container image"
      class:hide="{shouldSyncTopPhoto}"
      on:click="{() => {
        if (shouldSyncTopPhoto) {
          return;
        }
        imageIsSelected = !imageIsSelected;
      }}"
    >
      <label htmlFor="imageNode" class:error="{errorObj.imageNode}">
        image
      </label>
      {#if imageNode.size}
        <Image node="{imageNode}" hideBorder="{!imageIsSelected}" hideCaption />
      {/if}
    </div>
  </div>
</div>
<div class="middle-wrapper">
  <div class="toggle-wrapper">
    <Toggle
      value="{shouldSyncTitleAndAbstract}"
      onUpdate="{toggleTitleAndAbstract}"
    >
      <span class="toggle-label">
        Keep Title and Abstract in sync with top 2 sections of content?
      </span>
    </Toggle>
  </div>
  <div class="toggle-wrapper">
    <Toggle value="{shouldSyncTopPhoto}" onUpdate="{toggleImage}">
      <span class="toggle-label">
        Keep Image in sync with first Photo in content?
      </span>
    </Toggle>
  </div>
  <div class="message-container">
    {#if Object.values(errorObj).length}
      <span class="error">
        Error:{` ${Object.values(errorObj).join('')}`}
        <span role="img" aria-label="woman shrugging">🤷 ‍</span>
      </span>
    {/if}
    {#if shouldShowSuccessMessage}
      <span class="success">
        Saved{' '}
        <span role="img" aria-label="thumbs up">👍</span>
      </span>
    {/if}
  </div>
  <div class="filbert-flex-grid-9">
    <div class="filbert-col-9">
      <ButtonSpinner
        primary
        loading="{saveLoading}"
        disabled="{!shouldWarnForUnsaved}"
        label="Save"
        onClick="{savePost}"
      />
    </div>
    <div class="filbert-col-9">
      <ButtonSpinner
        primary
        label="{postMap.get('published') ? `Published on ${formatPostDate(postMap.get('published'))}` : 'Publish'}"
        onClick="{publishPost}"
        disabled="{postMap.get('published') && 'disabled'}"
      />
    </div>
    <div class="filbert-col-9">
      <ButtonSpinner primary label="Duplicate" onClick="{duplicatePost}" />
    </div>
    <div class="filbert-col-9">
      <ButtonSpinner warning label="Delete" onClick="{deletePost}" />
    </div>
    <div class="filbert-col-9">
      <ButtonSpinner
        cancel
        label="Done"
        onClick="{() => {
          if (shouldWarnForUnsaved && !confirm('Lose unsaved changes?')) {
            return;
          }
          goto(nextUrl);
        }}"
      />
    </div>
  </div>
</div>
<!--{#if shouldSyncTopPhoto && imageIsSelected}-->
<!--  <EditImageForm-->
<!--    shouldHideCaption-->
<!--    offsetTop="{imageMenuOffsetTop}"-->
<!--    offsetLeft="{imageMenuOffsetLeft}"-->
<!--    {post}-->
<!--    nodeModel="{imageNode}"-->
<!--    update="{updateImage}"-->
<!--  />-->
<!--{/if}-->
