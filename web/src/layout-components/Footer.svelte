<script>
  import GitHubIcon from '../icons/github-mark.svelte';
  import InfoIcon from '../icons/info.svelte';
</script>

<style>
  footer {
    font-family: var(--code-font-family), monospaced;
    background: var(--filbert-lightGrey);
    padding: 20px;
    text-align: center;
    color: var(--filbert-grey);
  }

  .br {
    margin: 16px;
  }

  .social-links-container {
    display: flex;
    justify-content: center;
    cursor: pointer;
  }

  footer :global(svg) {
    display: block;
    height: 32px;
    width: 34px;
    margin: 20px 10px 0 10px;
    transition: fill 0.375s;
    fill: var(--filbert-grey);
  }
  footer :global(svg):hover {
    transition: fill 0.375s;
    fill: var(--filbert-darkGrey);
  }
</style>

<footer>
  <span role="img" aria-label="truck">🚚</span>
  {' '} 1/4/2020 some-hash-here-34df
  <div class="br"></div>
  <span role="img" aria-label="baby">👶</span>
  {' '} 1/4/2019
  <div class="social-links-container">
    <a class="filbert-link-alt" href="https://github.com/bc-jasond/filbert">
      <GitHubIcon />
    </a>
    <a class="filbert-link-alt" href="/help">
      <InfoIcon />
    </a>
  </div>
</footer>
