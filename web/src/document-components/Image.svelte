<script>
  export let node = Map();
  export let hideBorder = true;
  export let hideCaption = false;
  export let postListOverride = false;
  export let viewPostOverride = false;
  export let isEditing = false;
  export let setEditNodeId = undefined;

  import { beforeUpdate } from 'svelte';
  import { Map } from 'immutable';

  import { getId } from '@filbert/linked-list';
  import { NODE_TYPE_IMAGE, meta } from '@filbert/document';

  $: isEditMode = !!setEditNodeId;

  $: id = getId(node);
  $: metaLocal = meta(node);
  $: w = metaLocal.get('resizeWidth', metaLocal.get('width'));
  $: h = metaLocal.get('resizeHeight', metaLocal.get('height'));
  $: rotationDegrees = metaLocal.get('rotationDegrees', 0);
  $: url = metaLocal.get('url');
  // if the image is rotated left once or right once change the height of the image container
  // to the width of the image to cover the increased/decreased dimension after CSS transform
  $: figureHeightOverride =
    rotationDegrees === 90 || rotationDegrees === 270
      ? // current max-width of an ImageSection is 1000px...
        Math.min(w, 1000)
      : 0;

  // TODO: just use JS to manipulate the DOM directly in beforeUpdate()
  //  using JS to set the CSS Custom Properties is indirect and harder to read
  let figureHeightOverrideStyle;
  let placeholderContainerStyle;
  let placeholderFillStyle;
  // NOTE: set these styles in the beforeUpdate() lifecycle method or they will not be updated after client-side routing
  beforeUpdate(() => {
    figureHeightOverrideStyle = `--figure-height: ${figureHeightOverride}px;`;
    placeholderContainerStyle = `--width: ${w}px; --height: ${h}px;`;
    placeholderFillStyle = `--fill-padding: ${(h / w) * 100}%;`;
  });
</script>

<style>
  section {
    overflow: hidden;
    max-width: 1000px;
    margin: 0 auto 52px;
  }

  figure {
    position: relative;
  }
  .figure-height-override {
    height: var(--figure-height);
  }

  figcaption {
    text-align: center;
    margin-top: 10px;
  }

  .image-placeholder-container {
    position: relative;
    width: 100%;
    margin: 0 auto;
    max-width: var(--width);
    max-height: var(--height);
  }

  .image-placeholder-fill {
    padding-bottom: var(--fill-padding);
  }

  img {
    object-fit: cover;
    position: absolute;
    box-sizing: border-box;
    top: 0;
    left: 0;
    width: 100%;
    height: 100%;
    margin: 0;
    display: block;
    max-width: 100%;
    transition: transform 0.125s ease-out;
    border: 4px solid transparent;
  }

  .rotate-90 {
    transform-origin: left;
    transform: translate(50%, -50%) rotate(90deg);
  }

  .rotate-180 {
    transform: rotate(180deg);
  }

  .rotate-270 {
    transform-origin: right;
    transform: translate(-50%, -50%) rotate(-90deg);
  }

  .post-list-override {
    margin: 0 auto;
    max-width: 300px;
    max-height: 300px;
  }
  .view-post-override {
    margin: 0 auto;
    min-width: 300px;
    min-height: 200px;
  }

  @media (min-width: 768px) {
    .post-list-override {
      max-width: 150px;
      max-height: 150px;
    }
  }
</style>

<svelte:options immutable />
<section
  class="filbert-section"
  class:post-list-override="{postListOverride}"
  class:view-post-override="{viewPostOverride}"
  data-type="{NODE_TYPE_IMAGE}"
  name="{id}"
>
  <!--  https://css-tricks.com/what-i-like-about-writing-styles-with-svelte/#dynamic-values-without-a-runtime -->
  <!--  This is slick: using a style="" attribute to override CSS Custom Properties with JS vars in markup is quite choice, thx-->
  <!--  Update: this isn't slick.  Just use bind:this and set the DOM node styles directly with JS -->
  <figure
    class:figure-height-override="{figureHeightOverride}"
    style="{figureHeightOverrideStyle}"
  >
    <div
      class="image-placeholder-container"
      style="{placeholderContainerStyle}"
    >
      <div class="image-placeholder-fill" style="{placeholderFillStyle}"></div>
      <img
        class:edit-section-border="{isEditing}"
        class:edit-hover-border="{isEditMode && !hideBorder}"
        class:rotate-90="{rotationDegrees === 90}"
        class:rotate-180="{rotationDegrees === 180}"
        class:rotate-270="{rotationDegrees === 270}"
        on:click="{() => setEditNodeId?.(id)}"
        src="{url}"
        alt="{metaLocal.get('caption')}"
      />
    </div>
    {#if metaLocal.get('caption') && !hideCaption}
      <figcaption class="mini-text">{metaLocal.get('caption')}</figcaption>
    {/if}
  </figure>
</section>
