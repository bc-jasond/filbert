<script>
  export let post;

  import { fromJS } from 'immutable';
  import { goto } from '@sapper/app';

  import Image from '../../document-components/Image.svelte';
  import Toggle from '../../form-components/Toggle.svelte';
  import ButtonSpinner from '../../form-components/ButtonSpinner.svelte';

  $: postMap = fromJS(post);

  let inputDomNode;
  let errorObj = {};
  let imageIsSelected;

  function updatePost(postLocal) {
    postMap = postLocal;
    errorObj = {};
    successMessage = null;
  }
</script>

<style>
  .filbert-input-container {
    opacity: 1;
    transition: opacity 0.125s ease-out;
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
      width: 50%;
    }
  }
</style>

<h1>Manage{post.get('published') ? ' Post' : ' Draft'}</h1>
<h2>Edit Listing Details, Publish, Duplicate & Delete</h2>
<div class="filbert-flex-grid">
  <div class="filbert-col">
    <div
      class="filbert-input-container"
      class:hide="{shouldSyncTitleAndAbstract}"
    >
      <Label htmlFor="title" class:error="{errorObj.title}">title</Label>
      <input
        name="title"
        type="text"
        value="{post.get('title')}"
        disabled="{shouldSyncTitleAndAbstract}"
        on:change="{(e) => {
          updatePost(post.set('title', e.target.value));
        }}"
        class:error="{errorObj.title}"
        bind:this="{inputDomNode}"
      />
    </div>
    <div class="filbert-input-container" class:hide="{post.get('published')}">
      <label htmlFor="canonical" class:error="{errorObj.canonical}">
        canonical
      </label>
      <input
        name="canonical"
        type="text"
        value="{post.get('canonical')}"
        disabled="{post.get('published')}"
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
        value="{post.get('abstract')}"
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
      <ButtonSpinner label="Save" onClick="{savePost}" />
    </div>
    <div class="filbert-col-9">
      <ButtonSpinner
        label="{post.get('published') ? `Published on ${formatPostDate(post.get('published'))}` : 'Publish'}"
        onClick="{publishPost}"
        disabled="{post.get('published') && 'disabled'}"
      />
    </div>
    <div class="filbert-col-9">
      <ButtonSpinner label="Duplicate" onClick="{duplicatePost}" />
    </div>
    <div class="filbert-col-9">
      <ButtonSpinner warning label="Delete" onClick="{deletePost}" />
    </div>
    <div class="filbert-col-9">
      <button
        class="filbert-nav-button cancel"
        on:click="{() => {
          goto(getNextFromUrl());
        }}"
      >
        <span class="button-span">Done</span>
      </button>
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
