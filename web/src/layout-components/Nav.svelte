<script>
  export let segment;
  export let navHeight = 0; // will be bound to in _layout.svelte via "bind:navHeight".  Initializing here so svelte doesn't complain

  import { afterUpdate, onMount } from 'svelte';
  import { goto, stores } from '@sapper/app';
  import { Map } from 'immutable';

  import HeaderLogo from './HeaderLogo.svelte';
  import {
    PAGE_NAME_EDIT,
    PAGE_NAME_VIEW,
    PAGE_NAME_USER_PROFILE,
    SANS_FONT_THEME,
    MIXED_FONT_THEME,
    LIGHT_MODE_THEME,
    DARK_MODE_THEME,
  } from '../common/constants';
  import { getApiClientInstance } from '../common/api-client';

  const { session } = stores();

  // workaround for SSR to avoid calling browser-only globals like "window" or "localStorage" globals on the server
  // afterUpdate, onMount won't run on the server
  let userIsMe;
  afterUpdate(async () => {
    userIsMe = window.location.href.includes($session?.user?.username);
  });
  let manageUrl;
  onMount(async () => {
    const { createNextUrl } = await import('../common/dom.js');
    manageUrl = createNextUrl(`/manage/${post.get('id')}`);
  });

  let post = Map();
  let theme = $session?.preferences?.theme;
  let font = $session?.preferences?.font;

  $: themeButtonDisplay = theme === DARK_MODE_THEME ? '☀️' : '🌑';
  $: fontButtonDisplay = font === SANS_FONT_THEME ? '🖋' : '✏️';
  $: shouldShowManagePost = segment === PAGE_NAME_EDIT && post.get('id');
  $: shouldShowEdit = segment === PAGE_NAME_VIEW && post.get('canEdit');
  $: shouldShowNew = true; //segment !== PAGE_NAME_EDIT || post.get('id');
  $: shouldShowLogoutButton = segment === PAGE_NAME_USER_PROFILE && userIsMe;
  const shouldShowPublic = true; // pageName !== PAGE_NAME_PUBLIC;

  function handleSignout() {
    if (confirm('Sign out?')) {
      goto('/signout');
    }
  }
  function toggleFont() {
    font = font === SANS_FONT_THEME ? MIXED_FONT_THEME : SANS_FONT_THEME;
    getApiClientInstance(fetch).patch('/preferences', { font });
    if (font === SANS_FONT_THEME) {
      document.body.classList.add(SANS_FONT_THEME);
    } else {
      document.body.classList.remove(SANS_FONT_THEME);
    }
  }
  function toggleTheme() {
    theme = theme === DARK_MODE_THEME ? LIGHT_MODE_THEME : DARK_MODE_THEME;
    getApiClientInstance(fetch).patch('/preferences', { theme });
    if (theme === DARK_MODE_THEME) {
      document.body.classList.add(DARK_MODE_THEME);
    } else {
      document.body.classList.remove(DARK_MODE_THEME);
    }
  }
</script>

<style>
  header {
    position: fixed;
    box-sizing: border-box;
    z-index: 12;
    width: 100%;
    background: var(--background-color-primary);
    border-bottom: 1px solid var(--background-color-secondary);
    opacity: 0.97;
    letter-spacing: 0;
    font-weight: 400;
    font-style: normal;
    top: 0;
  }

  /* used as a container for the left logo and menu items on the right */
  nav {
    min-height: var(--filbert-nav-height);
    padding-left: 20px;
    padding-right: 20px;
    margin: 0 auto;
  }
  .nav-logo {
    display: flex;
    align-items: center;
    justify-content: center;
  }
  .nav-scroll {
    overflow-x: auto;
  }
  .nav-actions {
    display: flex;
    align-items: center;
    white-space: nowrap;
  }

  button,
  a {
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

  button:hover,
  a:hover {
    color: var(--filbert-abramovTextWhite);
    background-color: var(--accent-color-primary);
    box-shadow: var(--filbert-box-shadow);
  }

  @media (min-width: 768px) {
    header {
      display: flex;
      align-items: center;
      flex-direction: row;
      justify-content: space-between;
    }

    nav {
      display: flex;
      margin: 0;
    }
  }
</style>

<header bind:clientHeight="{navHeight}">
  <nav class="nav-logo">
    <HeaderLogo />
  </nav>
  <nav class="nav-scroll">
    <div class="nav-actions">
      <button title="font style" on:click="{toggleFont}">
        {fontButtonDisplay}
      </button>
      <button title="dark mode" on:click="{toggleTheme}">
        {themeButtonDisplay}
      </button>
      {#if $session.user}
        {#if shouldShowManagePost}
          <a href="{manageUrl}">manage</a>
        {/if}
        {#if shouldShowEdit}
          <a href="/edit/{post.get('id')}">edit</a>
        {/if}
        {#if shouldShowNew}
          <a href="/edit/new">new</a>
        {/if}
        {#if shouldShowPublic}
          <a rel="prefetch" href="/public">public</a>
        {/if}
        <a rel="prefetch" href="/private">private</a>
        {#if shouldShowLogoutButton}
          <button id="logout-button" on:click="{handleSignout}">
            sign out
          </button>
        {:else}
          <a
            rel="prefetch"
            id="signed-in-user"
            href="/user/@{$session.user.username}"
          >
            {$session.user.username}
          </a>
        {/if}
      {:else}
        <a rel="prefetch" href="/public">public</a>
        <a data-test-id="signed-in-user" href="/signin">join or sign in</a>
      {/if}
    </div>
  </nav>
</header>
