<script>
  export let shouldFormat = false;
</script>

<style>
  span {
    color: var(--text-color-secondary);
    text-decoration: line-through;
    font-family: inherit;
  }
</style>

{#if shouldFormat}
  <span>
    <slot></slot>
  </span>
{:else}
  <slot></slot>
{/if}