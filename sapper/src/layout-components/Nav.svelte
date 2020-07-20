<script>
  export let segment;

  import { onMount } from 'svelte';
  import { goto } from '@sapper/app';
  import { Map } from 'immutable';

  import HeaderLogo from './HeaderLogo.svelte';
  import { SANS_FONT_THEME, DARK_MODE_THEME, PAGE_NAME_EDIT, PAGE_NAME_VIEW } from '../common/constants';

  // workaround for SSR to avoid calling "window" global on the server
  // onMount won't run on the server
  let manageUrl;
  onMount(async () => {
    const { createNextUrl } = await import('../common/dom.js');
    manageUrl = createNextUrl(`/manage/${post.get('id')}`);
  });

  let loading = true;
  setInterval(() => loading = !loading, 10000);

  let session = Map();
  setInterval(() => session ? session = undefined : session = Map(), 20000);

  let post = Map();
  let userIsMe = false;
  let theme = '';
  let themeButtonDisplay = theme === DARK_MODE_THEME ? '☀️' : '🌑';
  let font = '';
  let fontButtonDisplay = font === SANS_FONT_THEME ? '🖋' : '✏️';

  const shouldShowManagePost = segment === PAGE_NAME_EDIT && post.get('id');
  const shouldShowEdit = segment === PAGE_NAME_VIEW && post.get('canEdit');
  const shouldShowNew = segment !== PAGE_NAME_EDIT || post.get('id');
  const shouldShowPublic = true; // pageName !== PAGE_NAME_PUBLIC;

  function handleSignout() {
    if (confirm('Sign out?')) {
      goto('/signout');
    }
  }
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

  button, a {
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

  button:hover, a:hover {
    color: var(--filbert-abramovTextWhite);
    background-color: var(--accent-color-primary);
    box-shadow: var(--filbert-box-shadow);
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
    <button title="font style"
            on:click="{()=>{}}"
    >
      {fontButtonDisplay}
    </button>
    <button title="dark mode"
            on:click="{()=>{}}"
    >
      {themeButtonDisplay}
    </button>
    {#if session}
      {#if shouldShowManagePost}
        <a href="{manageUrl}">
          manage
        </a>
      {/if}
      {#if shouldShowEdit}
        <a href="/edit/{post.get('id')}">edit</a>
      {/if}
      {#if shouldShowNew}
        <a href="/edit/new">new</a>
      {/if}
      {#if shouldShowPublic}
        <a href="/p">public</a>
      {/if}
      <a href="/private">private</a>
      {#if userIsMe}
        <button
            id="signed-in-user"
            on:click={handleSignout}
        >
          sign out
        </button>
      {:else}
        <a data-test-id="signed-in-user" href="/me">
          {session.get('username')}
        </a>
      {/if}
    {:else}
      <a href="/p">public</a>
      <a data-test-id="signed-in-user" href="/signin">join or sign in</a>
    {/if}
  </nav>
</header>
