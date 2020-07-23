<script>
  export let shouldFormat = false;
</script>

<style>
  code {
    font-family: var(--code-font-family), monospace;
    font-size: var(--code-font-size);
    font-weight: var(--code-font-weight);
    line-height: var(--code-line-height);
    letter-spacing: var(--code-letter-spacing);
    color: var(--text-color-secondary);
    background: var(--background-color-secondary);
    padding: 4px;
    margin: 0 2px;
  }
</style>

{#if shouldFormat}
  <code>
    <slot></slot>
  </code>
{:else}
  <slot></slot>
{/if}