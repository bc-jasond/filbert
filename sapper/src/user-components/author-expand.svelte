<script>
  export let username;
</script>

<style>
  a {
    font-family: var(--code-font-family), monospaced;
    color: var(--filbert-grey);
    cursor: pointer;
    text-decoration: none;
    transition: letter-spacing 0.125s, color 0.125s;
  }

  a:hover {
    letter-spacing: 8px;
    color: var(--text-color-secondary);
    cursor: pointer;
  }
</style>

<a class="meta-font-mixin" href="/public/?username={username}">
  @{username}
</a>