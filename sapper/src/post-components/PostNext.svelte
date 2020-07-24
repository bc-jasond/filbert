<script>
  import ExpandLink from '../layout-components/ExpandLink.svelte';
  import { Map } from 'immutable';

  export let post = Map();
  export let isPrevious = false;

  import PostAvatar from './PostAvatar.svelte';
  import Image from '../document-components/Image.svelte';
  import H3 from '../document-components/H3.svelte';

  const colorVars = [
    '--filbert-lightGrey',
    '--filbert-lightBlue',
    '--filbert-lightOrange',
    '--filbert-lightSalmon',
  ];
  function fisherYates(arg) {
    const arr = [...arg];
    let i = arr.length,
      j,
      temp;
    while (--i > 0) {
      j = Math.floor(Math.random() * (i + 1)); // Get random number ranging between 0 and i
      temp = arr[j];
      arr[j] = arr[i];
      arr[i] = temp;
    }
    return arr;
  }
  const [toColor, fromColor] = fisherYates(colorVars);
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
  .placeholder-image {
    height: 400px;
    border-radius: 4px;
    background-image: radial-gradient(
      var(--gradient-from-color),
      var(--gradient-to-color)
    );
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
        <div
          class="placeholder-image"
          style="--gradient-to-color: var({toColor}); --gradient-from-color:
          var({fromColor});"
        ></div>
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
