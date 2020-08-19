<script>
  export let shouldFormat = false;
</script>

<style>
  strong {
    color: var(--text-color-secondary);
    font-weight: 700;
  }
</style>

{#if shouldFormat}
  <strong>
    <slot />
  </strong>
{:else}
  <slot />
{/if}
