<script>
  export let segment;

  import HeaderLogo from './HeaderLogo.svelte';

  let loading = true;
  setInterval(() => loading = !loading, 10000);
</script>

<style>
  header {
    position: fixed;
    display: flex;
    flex-direction: column;
    align-items: center;
    box-sizing: border-box;
    z-index: 12;
    width: 100%;
    background: var(--background-color-primary);
    opacity: 0.97;
    letter-spacing: 0;
    font-weight: 400;
    font-style: normal;
    top: 0;
  }
  /* used as a container for the left logo and menu items on the right */
  nav {
    position: relative;
    min-height: var(--filbert-nav-height);
    padding-left: 20px;
    padding-right: 20px;
    margin: 0 auto 8px auto;
    display: flex;
    align-items: center;
    justify-content: space-evenly;
  }

  @media (min-width: 768px) {
    header {
      flex-direction: row;
      justify-content: space-between;
    }
    nav {
      margin: 0;
    }
  }
</style>

<header>
  <nav>
    <HeaderLogo loading={loading} />
  </nav>
  <nav>

  </nav>
</header>
