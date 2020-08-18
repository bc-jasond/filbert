<script>
  export let shouldFormat = false;
</script>

<style>
  span {
    color: var(--text-color-secondary);
    font-family: var(--alt-font-family), sans-serif;
    font-size: var(--alt-font-size);
    font-weight: var(--alt-font-weight);
    line-height: var(--alt-line-height);
    letter-spacing: var(--alt-letter-spacing);
  }
</style>

{#if shouldFormat}
  <span>
    <slot />
  </span>
{:else}
  <slot />
{/if}
