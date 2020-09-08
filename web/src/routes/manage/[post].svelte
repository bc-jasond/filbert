<script context="module">
  import {getApiClientInstance} from '../../common/api-client';

  export async function preload({params}, session) {
    return {
      post: {}
    }
  }
</script>

<script>
  export let post;

  import { Map, fromJS } from 'immutable';
  import { goto } from '@sapper/app';

  import H1 from '../../document-components/H1.svelte';
  import H2 from '../../document-components/H2.svelte';
  import Image from '../../document-components/Image.svelte';
  import Toggle from '../../form-components/Toggle.svelte';
  import ButtonSpinner from '../../form-components/ButtonSpinner.svelte';

  $: postMap = fromJS(post);

  let inputDomNode;
  let errorObj = {};
  let imageIsSelected;
  let shouldSyncTitleAndAbstract;
  let imageContainerId;
  let shouldSyncTopPhoto;
  let imageNode = Map()
  let successMessage;

  function toggleTitleAndAbstract() {}
  function toggleImage() {}
  function savePost() {}
  function publishPost() {}
  function duplicatePost() {}
  function deletePost() {}

  function updatePost(postLocal) {
    postMap = postLocal;
    errorObj = {};
    successMessage = null;
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
  @media (min-width: 768px) {
    .middle-wrapper {
      width: 75%;
      margin: 0 auto;
      padding: 0 20px 40px 20px;
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
        on:change="{(e) => {
          updatePost(post.set('title', e.target.value));
        }}"
        class:error="{errorObj.title}"
        bind:this="{inputDomNode}"
      />
    </div>
    <div class="filbert-input-container" class:hide="{postMap.get('published')}">
      <label htmlFor="canonical" class:error="{errorObj.canonical}">
        canonical
      </label>
      <input
        name="canonical"
        type="text"
        value="{postMap.get('canonical')}"
        disabled="{postMap.get('published')}"
        on:change="{(e) => {
          updatePost(post.set('canonical', e.target.value));
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
        on:change="{(e) => {
          updatePost(post.set('abstract', e.target.value));
        }}"
        class:error="{errorObj.abstract}"
      ></textarea>
    </div>
  </div>
  <div class="filbert-col">
    <div
      class="filbert-input-container image"
      id="{imageContainerId}"
      shouldHide="{shouldSyncTopPhoto}"
      on:click="{() => (imageIsSelected = !imageIsSelected)}"
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
    {#if successMessage}
      <span class="success">
        Saved{' '}
        <span role="img" aria-label="thumbs up">👍</span>
        {successMessage}
      </span>
    {/if}
  </div>
  <div class="filbert-flex-grid-9">
    <div class="filbert-col-9">
      <ButtonSpinner primary label="Save" onClick="{savePost}" />
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
      <ButtonSpinner cancel
                     label="Done"
        onClick="{() => {
          goto(getNextFromUrl());
        }}"
      />
    </div>
  </div>
</div>
{#if shouldSyncTopPhoto && imageIsSelected}
  <EditImageForm
    shouldHideCaption
    offsetTop="{imageMenuOffsetTop}"
    offsetLeft="{imageMenuOffsetLeft}"
    {post}
    nodeModel="{imageNode}"
    update="{updateImage}"
  />
{/if}
