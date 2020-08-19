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
    border: 1px solid transparent;
    border-radius: 2px;
  }
  .post-nav-col:hover {
    border-radius: 2px;
    border: 1px solid var(--background-color-secondary);
    box-shadow: var(--filbert-box-shadow-alt);
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
  }
</style>

<a
  class="filbert-col filbert-link-alt post-nav-col"
  href="/public/{post.get('canonical')}"
  rel="prefetch"
>
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

  </div>
  <div class="title-container">
    <span class="filbert-link-alt heading-link">{post.get('title')}</span>
  </div>
  <div class="abstract-container">
    <span class="filbert-link-alt abstract-link">{post.get('abstract')}</span>
  </div>
  <div class="post-avatar-container">
    <PostAvatar {post} showHandle />
  </div>
</a>
