<script>
  export let shouldFormat = false;
</script>

{#if shouldFormat}
  <em class="italic-text">
    <slot />
  </em>
{:else}
  <slot />
{/if}
