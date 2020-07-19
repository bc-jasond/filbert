<script context="module">
  export async function preload(page, session) {
    const {path, params, query} = page;
    return { routeInfo: page };
  }
</script>

<script>
  export let routeInfo;
</script>

<h1>{routeInfo.params.post}</h1>