<svelte:options immutable/>

<script>
  export let nextPostOverride = false;
  export let fontWeightNormal = false;
</script>

<style>
  h3 {
    color: var(--title-color-secondary);
    text-overflow: ellipsis;
    margin-bottom: 8px;
    letter-spacing: -0.47px;
    font-size: 25.2px;
    line-height: 28px;
    font-weight: 600;
    font-style: normal;
    font-family: var(--h2-font-family), sans-serif;
  }
  .next-post-override {
    font-family: var(--code-font-family);
    color: var(--filbert-grey);
    text-align: center;
    margin-bottom: 16px;
  }
  .font-weight-normal {
    font-weight: normal;
  }
</style>

<h3
  class="filbert-section"
  class:next-post-override="{nextPostOverride}"
  class:font-weight-normal="{fontWeightNormal}"
>
  <slot />
</h3>
