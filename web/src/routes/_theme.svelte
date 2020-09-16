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

  :global(.code-text) {
    font-family: var(--code-font-family), monospace;
    font-size: var(--code-font-size);
    font-weight: var(--code-font-weight);
    line-height: var(--code-line-height);
    letter-spacing: var(--code-letter-spacing);
    color: var(--text-color-secondary);
    background: var(--background-color-secondary);
    padding: 4px;
    margin: 0 2px;
  }

  :global(.filbert-alt-font) {
    font-family: var(--alt-font-family);
    font-size: var(--alt-font-size);
    font-weight: var(--alt-font-weight);
    line-height: var(--alt-line-height);
    letter-spacing: var(--alt-letter-spacing);
  }

  :global(.filbert-nav-button) {
    font-family: var(--code-font-family), monospaced;
    color: var(--filbert-grey);
    cursor: pointer;
    text-decoration: none;
    font-size: 18px;
    line-height: 24px;
    padding: 14px 18px;
    border-radius: 26px;
    border: 1px solid transparent;
    transition: background-color 0.125s, color 0.125s;
    flex-grow: 0;
  }
  :global(.filbert-nav-button):hover {
    color: var(--filbert-abramovTextWhite);
    background-color: var(--accent-color-primary);
    box-shadow: var(--filbert-box-shadow);
  }
  :global(.filbert-nav-button.open) {
    color: var(--filbert-abramovTextWhite);
    background-color: var(--accent-color-primary);
  }

  :global(.filbert-nav-button.cancel) {
    background: var(--filbert-mediumGrey);
  }
  :global(.filbert-nav-button.cancel):hover {
    background: var(--filbert-grey);
  }
  :global(.button-span) {
    color: white;
    font-family: var(--alt-font-family);
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
    background-position: 0 calc(1em + 2px);
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

  :global(.filbert-link-alt) {
    text-decoration: none;
    text-overflow: ellipsis;
    overflow: hidden;
    font-style: normal;
    font-family: var(--filbert-sans-serif), sans-serif;
  }

  :global(.abstract-link) {
    max-height: 48px;
    font-size: 19px;
    line-height: 24px;
    color: var(--filbert-grey);
    letter-spacing: 0px;
  }

  :global(.heading-link) {
    max-height: 56px;
    letter-spacing: -0.5px;
    font-size: 25px;
    line-height: 28px;
    font-weight: 600;
  }

  :global(.filbert-flex-grid),
  :global(.filbert-flex-grid-9) {
    display: block;
  }

  :global(.filbert-col) {
    padding: 0;
    flex: 1;
  }

  :global(.filbert-col-9) {
    padding: 0;
    flex: 0;
    white-space: nowrap;
  }

  /* FORMS */
  :global(.input-container) {
    display: flex;
    flex-direction: column;
    margin: 24px 0;
  }
  :global(.input-container:last-of-type) {
    margin-bottom: 48px;
  }
  :global(textarea) {
    font-size: 18px;
    font-weight: 400;
    font-family: var(--code-font-family);
    line-height: 36px;
    border-radius: 2px;
    border: 1px solid var(--filbert-grey);
    padding: 2px 8px;
    min-height: 200px;
  }
  :global(textarea.error) {
    border-color: var(--filbert-error);
  }
  :global(label) {
    display: block;
    margin-bottom: 4px;
    font-family: var(--alt-font-family);
  }
  :global(label.error) {
    color: var(--filbert-error);
  }
  :global(input) {
    font-size: 18px;
    font-weight: 400;
    font-family: var(--code-font-family);
    line-height: 36px;
    border-radius: 2px;
    border: 1px solid var(--filbert-grey);
    padding: 2px 8px;
  }
  :global(input.error) {
    border-color: var(--filbert-error);
  }
  :global(.lil-sassy-menu) {
    position: absolute;
    transition: 0.1s top;
    z-index: 13;
    background-image: linear-gradient(
      to bottom,
      rgba(49, 49, 47, 0.99),
      #262625
    );
    background-repeat: repeat-x;
    border-radius: 5px;
    padding: 0 10px;
    color: var(--filbert-darkGrey);
  }
  :global(.lil-sassy-menu .point-clip) {
    position: absolute;
    bottom: -10px;
    left: 50%;
    clip: rect(10px 20px 20px 0);
    margin-left: -10px;
  }
  :global(.lil-sassy-menu .arrow) {
    display: block;
    width: 20px;
    height: 20px;
    background-color: #262625;
    transform: rotate(45deg) scale(0.5);
  }
  :global(.dark-input) {
    background: rgba(0, 0, 0, 0);
    color: #fff;
    border: none;
    font-size: 16px;
    border-radius: 5px;
    display: block;
    box-sizing: border-box;
    width: 100%;
  }

  :global(.svg-icon-mixin) {
    fill: var(--filbert-white);
    position: relative;
    top: -1px;
    vertical-align: middle;
    height: 100%;
    width: 100%;
    border-bottom: 2px solid transparent;
  }
  :global(.svg-icon-mixin:hover) {
    fill: var(--accent-color-primary);
  }
  :global(.svg-icon-mixin.selected) {
    fill: var(--accent-color-primary);
  }

  @media (min-width: 768px) {
    :global(.filbert-flex-grid) {
      display: flex;
    }

    :global(.filbert-col) {
      padding-left: 24px;
    }

    :global(.filbert-col):first-of-type {
      padding: 0;
    }
  }

  @media (min-width: 992px) {
    :global(.filbert-flex-grid-9) {
      display: flex;
      justify-content: space-evenly;
    }

    :global(.filbert-col),
    :global(.filbert-col):first-of-type {
      padding: 16px;
    }

    :global(.filbert-col-9) {
      padding-left: 24px;
    }

    :global(.filbert-col-9) {
      padding: 0;
    }
  }
</style>
