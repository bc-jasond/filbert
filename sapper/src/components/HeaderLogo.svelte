<script>
  export let loading;

  const baseText = 'filbert';
  let frameCount = 0;
  let loadingText = baseText;
  let intervalId;

  if (loading) {
    intervalId = setInterval(() => {
      // writes "filbert" one char at a time
      loadingText = `${baseText.slice(0, Math.floor(frameCount / 8))}`;
      frameCount = frameCount + 1 > 80 ? 0 : frameCount + 1;
    }, 20);
  }
  // TODO: clearInterval()
</script>

<style>
  @keyframes pulse {
    0%, 100% {
      opacity: 0.30;
    }
    60% {
      opacity: 1;
    }
  }

  #filbert-logo-loader {
    font: inherit;
    color: inherit;
    animation: 3s pulse linear infinite;
  }

  .logo-link {
    font-size: 28px;
    transition: font-size 0.125s;
    font-family: var(--code-font-family), monospaced;
    color: var(--filbert-grey);
    text-decoration: none;
    flex-grow: 2;
    flex-shrink: 0;
    align-self: flex-end;
  }

  .logo-link:hover {
    font-size: 32px;
  }

  @media (min-width: 768px) {
    .logo-link {
      align-self: center;
    }
  }
</style>

<a class="logo-link" href="/p/homepage">
<span role="img" aria-label="hand writing with a pen">
✍️
</span>{' '}
  {#if loading}
    <span id="filbert-logo-loader">{loadingText}</span>
  {:else}
    filbert
  {/if}
</a>