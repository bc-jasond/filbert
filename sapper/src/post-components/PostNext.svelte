<script>
  import { Map } from 'immutable';

  export let post = Map();
  export let isPrevious = false;

  import ExpandLink from '../layout-components/ExpandLink.svelte';
  import PostAvatar from './PostAvatar.svelte';
  import Image from '../document-components/Image.svelte';
  import H3 from '../document-components/H3.svelte';
  import PostImagePlaceholder from './PostImagePlaceholder.svelte';
</script>

<style>
  .post-nav-col {
    margin-bottom: 32px;
  }

  .image-container {
    margin-bottom: 4px;
    max-height: 400px;
    overflow: hidden;
  }
  .title-container {
    padding: 4px;
  }
  .abstract-container {
    padding: 4px;
  }
  .post-avatar-container {
    padding: 4px;
  }

  @media (min-width: 768px) {
    .image-container {
      max-height: 250px;
    }
    .placeholder-image {
      height: 250px;
    }
  }
</style>

<div class="filbert-col post-nav-col">

  <ExpandLink url="/public/{post.get('canonical')}">
    <H3 nextPostOverride>
      {#if isPrevious}
        <span role="img" aria-label="finger pointing left">
          👈👈👈{' '}previous
        </span>
      {:else}
        <span role="img" aria-label="finger pointing right">
          next{' '}👉👉👉
        </span>
      {/if}
    </H3>
  </ExpandLink>

  <div class="image-container">
    <a class="filbert-link-alt" href="/public/{post.get('canonical')}">
      {#if post.getIn(['meta', 'imageNode'])}
        <Image
          node="{post.getIn(['meta', 'imageNode'])}"
          hideBorder
          hideCaption
          viewPostOverride
        />
      {:else}
        <PostImagePlaceholder />
      {/if}
    </a>
  </div>
  <div class="title-container">
    <a
      class="filbert-link-alt heading-link"
      href="/public/{post.get('canonical')}"
    >
      {post.get('title')}
    </a>
  </div>
  <div class="abstract-container">
    <a
      class="filbert-link-alt abstract-link"
      href="/public/{post.get('canonical')}"
    >
      {post.get('abstract')}
    </a>
  </div>
  <div class="post-avatar-container">
    <PostAvatar {post} showHandle />
  </div>
</div>
