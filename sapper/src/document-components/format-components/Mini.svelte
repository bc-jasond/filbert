<script>
  export let shouldFormat = false;
</script>

{#if shouldFormat}
  <span class="mini-text">
    <slot></slot>
  </span>
{:else}
  <slot></slot>
{/if}