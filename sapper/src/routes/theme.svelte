<style>
  /* put default styles and "mixin" classes here
     trying to see if I can get away without using a CSS preprocessor
  */
  :global(.filbert-section) {
    max-width: 740px;
    margin: 0 auto;
  }

  :global(.content-section) {
    font-family: var(--filbert-content-serif), serif;
    font-size: 21px;
    line-height: 1.58;
    letter-spacing: -0.01em;
    margin-bottom: 52px;
  }

  :global(.meta-font) {
    letter-spacing: 0px;
    font-size: 16px;
    line-height: 18px;
    font-style: normal;
  }

  :global(.italic-text) {
    font-family: var(--filbert-italic-serif), sans-serif;
    color: var(--text-color-secondary);
  }

  :global(.mini-text) {
    font-family: var(--mini-font-family), sans-serif;
    font-weight: var(--mini-font-weight);
    font-style: normal;
    font-size: var(--mini-font-size);
    line-height: var(--mini-line-height);
    color: var(--text-color-secondary);
    letter-spacing: var(--mini-letter-spacing);
  }

  :global(.filbert-link) {
    color: var(--accent-color-secondary);
    cursor: pointer;
    font: inherit;
    text-decoration: none;
    background-repeat: repeat-x;
    background-image: linear-gradient(
        to right,
        currentColor 100%,
        currentColor 0
    );
    background-size: 1px 1px;
    background-position: 0 calc(1em + 1px);
  }

  :global(.filbert-link):hover {
    color: var(--accent-color-primary);
    background-image: linear-gradient(
        to right,
        currentColor 100%,
        currentColor 0
    );
  }

  :global(.filbert-link):visited {
    color: mediumpurple;
  }
</style>