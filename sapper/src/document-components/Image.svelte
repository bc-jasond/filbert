<script>
  export let node;
  export let hideBorder;
  export let hideCaption;

  import { Map } from 'immutable';

  import { NODE_TYPE_IMAGE } from '../common/constants';

  let isEditing = false;
  let isEditMode = false;

  const id = node.get('id');
  const meta = node.get('meta', Map());
  const w = meta.get('resizeWidth', meta.get('width'));
  const h = meta.get('resizeHeight', meta.get('height'));
  const url = meta.get('url');
  const rotationDegrees = meta.get('rotationDegrees', 0);
  let heightOverride;
  // if the image is rotated left once or right once change the height of the image container
  // to the width of the image to cover the increased/decreased dimension after CSS transform
  if (rotationDegrees === 90 || rotationDegrees === 270) {
    // current max-width of an ImageSection is 1000px...
    heightOverride = Math.min(w, 1000);
  }
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

  .height-override {
    height: var(--height-override);
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
  }

  .rotate-90 {
    transform-origin: left;
    transform: translate(50%, -50%) rotate(90deg);
  }

  .rotate-180 {
    transform: scale(1, -1);
  }

  .rotate-270 {
    transform-origin: right;
    transform: translate(-50%, -50%) rotate(-90deg);
  }
</style>

<section class="filbert-section" data-type={NODE_TYPE_IMAGE} name={id}>
<!--  https://css-tricks.com/what-i-like-about-writing-styles-with-svelte/#dynamic-values-without-a-runtime -->
<!--  This is slick: using a style="" attribute to override CSS Custom Properties with JS vars in markup is quite choice, thx-->
  <figure class:height-override={!Number.isNaN(heightOverride)} style="--height-override:{`${heightOverride}px;`}">
    <div class="image-placeholder-container" style="--width:{`${w}px`}; --height:{`${h}px`}">
      <div class="image-placeholder-fill" style="--fill-padding:{`${(h / w) * 100}%;`}"></div>
      <img
          class:edit-section-border={isEditing}
          class:edit-hover-border={isEditMode && !hideBorder}
          class:rotate-90={rotationDegrees === 90}
          class:rotate-180={rotationDegrees === 180}
          class:rotate-270={rotationDegrees === 270}
          on:click="{() => {}}"
          src={url}
          alt={meta.get('caption')}
      />
    </div>
    {#if !hideCaption}
      <figcaption class="mini-text">{meta.get('caption')}</figcaption>
    {/if}
  </figure>
</section>