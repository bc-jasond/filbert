<script context="module">
  export async function preload(page, session) {
    const {path, params, query} = page;
    return { post: page };
  }
</script>

<script>
  export let post;
</script>

<h1>{post.params.post}</h1>