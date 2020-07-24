<script>
  export let post;
  export let postIsPrivate = false;

  import { onMount } from 'svelte';

  import PostAvatar from './PostAvatar.svelte';
  import Image from '../document-components/Image.svelte';
  import ExpandLink from '../layout-components/ExpandLink.svelte';

  let nextUrl;
  onMount(async () => {
    const { createNextUrl } = await import('../common/dom');
    nextUrl = createNextUrl(`/manage/${post.get('id')}`);
  });
</script>

<style>
  .post-row {
    max-width: var(--filbert-viewport7);
    padding: 16px 0;
    border-top: 1px solid var(--background-color-secondary);
    align-items: center;
  }

  .post-row:last-of-type {
    margin-bottom: 42px;
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

<div class="filbert-flex-grid post-row">
  {#if post.getIn(['meta', 'imageNode'])}
    <div class="image-col">
      <a rel="prefetch" href="/public/{post.get('canonical')}">
        <Image
          node="{post.getIn(['meta', 'imageNode'])}"
          hideBorder
          hideCaption
          postListOverride
        />
      </a>
    </div>
  {/if}
  <div class="details-col">
    <a
      rel="prefetch"
      class="filbert-link-alt heading-link"
      href="/public/{post.get('canonical')}"
    >
      {post.get('title')}
    </a>
    {#if post.get('abstract')}
      <div class="post-abstract-row">
        <a
          rel="prefetch"
          class="filbert-link-alt abstract-link"
          href="/public/{post.get('canonical')}"
        >
          {post.get('abstract')}
        </a>
      </div>
    {/if}
    <div class="post-meta-row">
      <div class="post-action-container">
        <PostAvatar {post} {postIsPrivate} />
      </div>
      {#if post.get('canEdit')}
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
      {#if !postIsPrivate && post.get('canEdit')}
        <div class="post-action-container" style="--padding-left: 0px;">
          <a
            rel="prefetch"
            class="filbert-nav-button post-action-link"
            href="{`/edit/${post.get('id')}`}"
          >
            edit
          </a>
        </div>
      {/if}
      <div class="post-action-container">
        <ExpandLink url="/public/?username={post.get('username')}">
          @{post.get('username')}
        </ExpandLink>
      </div>
    </div>
  </div>
</div>
