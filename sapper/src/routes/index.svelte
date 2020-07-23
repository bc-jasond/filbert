<script context="module">
  export async function preload(page, session) {
    // TODO: if there's a logged in user, go to /private?
    const { user } = session;

    return this.redirect(302, 'public');
  }
</script>
