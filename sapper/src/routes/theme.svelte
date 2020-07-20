<style>
  /* put default styles and "mixin" classes here
     trying to see if I can get away without using a CSS preprocessor
  */

  :global(.meta-font-mixin) {
    letter-spacing: 0px;
    font-size: 16px;
    line-height: 18px;
    font-style: normal;
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