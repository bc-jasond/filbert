<script context="module">
  export async function preload(page, session) {
    // TODO: call API /signout
  }
</script>

<script>
  import H1 from '../document-components/H1.svelte';
</script>

<style>
  div {
    margin-top: 20vh;
    text-align: center;
    display: flex;
    align-items: center;
    justify-content: center;
  }
  .bigger {
    font-size: 72px;
  }
</style>

<div class="test">
  <H1>
    <span class="bigger">
      You're logged out
      <span role="img" aria-label="hand waving bye">👋</span>
    </span>
  </H1>
</div>
