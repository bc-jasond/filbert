<script>
  import { beforeUpdate } from 'svelte';

  import Theme from './_theme.svelte';
  import Nav from '../layout-components/Nav.svelte';
  import Footer from '../layout-components/Footer.svelte';

  export let segment;

  let navHeight;
  let navHeightOverride;
  beforeUpdate(() => {
    navHeightOverride = `--filbert-nav-height: ${navHeight}px;`;
  });
</script>

<style>
  :global(body) {
    --filbert-nav-height: 64px;
  }
  main {
    width: 100%;
    min-height: 80vh;
    padding: 16px 24px 48px 24px;
    margin: var(--filbert-nav-height) auto 0;
    box-sizing: border-box;
    position: relative;
  }

  @media (min-width: 768px) {
    main {
      padding: 48px 80px;
    }
  }
</style>

<Theme />
<Nav {segment} bind:navHeight />

<main style="{navHeightOverride}">
  <slot />
</main>

<Footer />
