<script>
  export let url;
  export let bigger = false;
</script>

<style>
  a,
  a :global(*) {
    font-family: var(--code-font-family), monospaced;
    color: var(--filbert-grey);
    cursor: pointer;
    text-decoration: none;
    transition: letter-spacing 0.125s, color 0.125s;
  }

  a:hover,
  a :global(*):hover {
    letter-spacing: 8px;
    color: var(--text-color-secondary);
    cursor: pointer;
  }

  .bigger {
    font-size: larger;
  }
</style>

<a class="meta-font {bigger ? 'bigger' : ''}" href="{url}">
  <slot />
</a>
