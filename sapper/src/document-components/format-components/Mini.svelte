<script>
  export let shouldFormat = false;
</script>

{#if shouldFormat}
  <span class="mini-text">
    <slot />
  </span>
{:else}
  <slot />
{/if}
