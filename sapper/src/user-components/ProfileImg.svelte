<script>
  export let src;
  export let alt = 'profile avatar';
  export let width = '72px';
  export let height = '72px';
  export let shouldApplyHoverStyle = false;
</script>

<style>
  div :global(img) {
    flex-shrink: 0;
    border-radius: 50%;
    margin: 8px;
    position: relative;
    z-index: 0;
  }
  .hover:hover {
    cursor: pointer;
    box-shadow: var(--filbert-box-shadow);
  }
</style>

<div>
  <img {src} {alt} {height} {width} class:hover="{shouldApplyHoverStyle}" />
</div>
