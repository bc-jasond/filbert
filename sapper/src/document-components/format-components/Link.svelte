<script>
  export let url = undefined;
</script>

{#if url}
  <a class="filbert-link" href={url}>
    <slot></slot>
  </a>
{:else}
  <slot></slot>
{/if}