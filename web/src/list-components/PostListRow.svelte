<script>
  export let post;
  export let postIsPrivate = false;

  $: postMap = fromJS(post);

  import { onMount } from 'svelte';
  import { fromJS } from 'immutable';

  import PostAvatar from '../post-components/PostAvatar.svelte';
  import PostImagePlaceholder from '../post-components/PostImagePlaceholder.svelte';
  import Image from '../document-components/Image.svelte';
  import ExpandLink from '../layout-components/ExpandLink.svelte';

  let nextUrl;
  onMount(async () => {
    const { createNextUrl } = await import('../common/dom');
    nextUrl = createNextUrl(`/manage/${postMap.get('id')}`);
  });
</script>

<style>
  .post-row {
    max-width: var(--filbert-viewport7);
    padding: 16px;
    border: 1px solid transparent;
    border-top: 1px solid var(--background-color-secondary);
    align-items: center;
  }
  .post-row:last-of-type {
    margin-bottom: 42px;
  }
  .post-row:hover {
    border-radius: 2px;
    border: 1px solid var(--background-color-secondary);
    box-shadow: var(--filbert-box-shadow-alt);
  }
  .post-row:hover + .post-row {
    border: 1px solid transparent;
  }

  .image-col {
    padding: 0;
    flex: 1;
    margin-bottom: 16px;
  }

  .details-col {
    padding: 0;
    flex: 4;
  }

  .post-abstract-row {
    margin-top: 4px;
  }

  .post-meta-row {
    display: flex;
    align-items: center;
    margin-top: 8px;
  }

  .post-action-container {
    position: relative;
    min-height: 18px;
    display: inline-block;
    padding-left: var(--padding-left, 8px);
  }

  .post-action-container:first-of-type {
    padding-left: 0;
  }

  .post-action-link {
    /* TODO: this is copied from .meta-font because of specificity issues */
    letter-spacing: 0px;
    font-size: 16px;
    line-height: 18px;
    font-style: normal;
    /* end */
    padding: 6px 8px;
  }

  @media (min-width: 768px) {
    .post-row {
      margin: 0 auto;
    }

    .image-col {
      margin-bottom: 0;
      margin-right: 16px;
    }
  }
</style>

<a
  class="filbert-flex-grid post-row filbert-link-alt"
  rel="prefetch"
  href="/public/{postMap.get('canonical')}"
>
  <div class="image-col">
    {#if postMap.getIn(['meta', 'imageNode'])}
      <Image
        node="{postMap.getIn(['meta', 'imageNode'])}"
        hideBorder
        hideCaption
        postListOverride
      />
    {:else}
      <PostImagePlaceholder postListOverride />
    {/if}
  </div>

  <div class="details-col">
    <span class="filbert-link-alt heading-link">{postMap.get('title')}</span>
    {#if postMap.get('abstract')}
      <div class="post-abstract-row">
        <span class="filbert-link-alt abstract-link">
          {postMap.get('abstract')}
        </span>
      </div>
    {/if}
    <div class="post-meta-row">
      <div class="post-action-container">
        <PostAvatar {post} {postIsPrivate} />
      </div>
      {#if postMap.get('canEdit')}
        <div class="post-action-container">
          <a
            rel="prefetch"
            class="filbert-nav-button post-action-link"
            href="{nextUrl}"
          >
            manage
          </a>
        </div>
      {/if}
      {#if !postIsPrivate && postMap.get('canEdit')}
        <div class="post-action-container" style="--padding-left: 0px;">
          <a
            rel="prefetch"
            class="filbert-nav-button post-action-link"
            href="{`/edit/${postMap.get('id')}`}"
          >
            edit
          </a>
        </div>
      {/if}
      <div class="post-action-container">
        <ExpandLink url="/public/?username={postMap.get('username')}">
          @{postMap.get('username')}
        </ExpandLink>
      </div>
    </div>
  </div>
</a>
