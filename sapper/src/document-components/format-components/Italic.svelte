<script>
  export let shouldFormat = false;
</script>

{#if shouldFormat}
  <em class="italic-text">
    <slot></slot>
  </em>
{:else}
  <slot></slot>
{/if}