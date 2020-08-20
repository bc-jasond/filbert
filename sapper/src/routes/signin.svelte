<script context="module">
  export function preload({query}) {
    return {isAdminLogin: query.admin !== undefined};
  }
</script>

<script>
  export let isAdminLogin;

  import { goto, stores } from '@sapper/app';
  import { onDestroy } from 'svelte';
  import { GoogleAuth } from '../stores';
  import { getGoogleUser } from '../common/google-auth';
  import { getApiClientInstance } from '../common/api-client';

  import ButtonSpinner from '../form-components/ButtonSpinner.svelte';

  import ProfileImg from '../user-components/ProfileImg.svelte';
  import H1 from '../document-components/H1.svelte';
  import H2 from '../document-components/H2.svelte';
  import H3 from '../document-components/H3.svelte';
  import GoogleLogoSvg from '../icons/google-logo.svelte';

  const { session } = stores();

  let usernameInputDomNode;
  let usernameAdminInputDomNode;
  let usernameValue = '';
  let username = '';
  let usernameIsInvalid = false;
  let shouldShowUsernameInput;
  let error;
  let success;
  let currentGoogleUser = {};
  let signinLoading = false;
  let signinButtonLabel;

  const googleAuthUnsubscribe = GoogleAuth.subscribe((auth) => {
    if (isAdminLogin) {
      return;
    }
    if (auth?.isSignedIn?.get?.()) {
      currentGoogleUser = getGoogleUser(auth?.currentUser?.get?.());
    } else {
      currentGoogleUser = {};
    }
  });

  onDestroy(googleAuthUnsubscribe)

  async function doLoginGoogle() {
    success = undefined;
    error = undefined;
    signinLoading = true;

    if (!currentGoogleUser.idToken) {
      // open google window to let the user select a user to login as, or to grant access
      try {
        const user = await $GoogleAuth.signIn();
        currentGoogleUser = getGoogleUser(user);
      } catch(err) {
        error = err;
        return;
      }
    }
    const {
      error: errorApi,
      signupIsIncomplete,
      ...filbertUser
    } = await getApiClientInstance(fetch).signinGoogle(currentGoogleUser, username);
    if (errorApi) {
      success = undefined;
      error = errorApi?.error || errorApi?.message || 'Error';
      signinLoading = false;
      return;
    }
    if (signupIsIncomplete) {
      shouldShowUsernameInput = true;
      error = undefined;
      success = undefined;
      signinLoading = false;
      usernameInputDomNode.focus();
      return;
    }
    session.set({ ...session, user: filbertUser });
    success = 'All set 👍';
    error = undefined;
    setTimeout(() => {
      // let some time pass to show the success message
      goto('/public/homepage');
    }, 400);
  }

  function doLogin() {
    alert("Admin")
  }

  function doLogout() {
    GoogleAuth.update(auth => auth.signOut());
  }

  $: {
    usernameValue = usernameValue.replace(/[^0-9a-z]/g, '').slice(0, 42);
    username = usernameValue;
    usernameIsInvalid = username.length < 5 || username.length > 42;
    error = undefined;
    success = undefined;
    if (isAdminLogin) {
      signinButtonLabel = 'Sign in to filbert';
    } else {
      signinButtonLabel = currentGoogleUser.givenName || shouldShowUsernameInput ? `Continue as ${shouldShowUsernameInput ? username : currentGoogleUser.givenName}` : 'Sign in to filbert with Google'
    }
  }
</script>

<style>
  section {
    display: flex;
    justify-content: center;
    align-items: center;
  }

  form {
    flex: 1;
    width: 40vw;
    max-width: 550px;
    overflow: hidden;
    background-color: var(--background-color-primary);
    border-radius: 2px;
  }
  .centered {
    text-align: center;
  }

  .google-info {
    display: flex;
    flex-direction: column;
    align-items: center;
    margin-bottom: 16px;
    font-size: 18px;
  }

  .google-info-span {
    font-family: var(--filbert-sans-serif);
    display: block;
    color: var(--title-color-primary);
    overflow: hidden;
    white-space: pre-wrap;
    text-overflow: ellipsis;
    padding: 4px;
  }

  .email {
    display: block;
    font-family: inherit;
    font-size: smaller;
  }

  .choose-username-info {
    display: block;
    font-family: inherit;
    font-weight: 400;
    margin-top: 16px;
  }

  .message-container {
    min-height: 36px;
    margin-bottom: 8px;
    text-align: center;
    font-family: var(--code-font-family);
    display: flex;
    align-items: center;
    justify-content: center;
  }

  .success {
    color: var(--filbert-success);
  }

  .error {
    color: var(--filbert-error);
  }

  section :global(.google-logo-svg) {
    position: absolute;
    margin: 0;
    left: 16px;
    flex-shrink: 0;
    height: 24px;
    width: 24px;
  }

  button {
    display: block;
    width: 100%;
    margin-bottom: 16px;
    background: var(--accent-color-primary);
  }

  a {
      display: block;
    text-align: center;
      margin: 8px;
  }
</style>

<section>
  <form on:submit|preventDefault="{() => isAdminLogin ? doLogin() : doLoginGoogle()}">
    <div class="centered">
      <H1>Sign In</H1>
    </div>
    {#if currentGoogleUser.imageUrl && currentGoogleUser.name && currentGoogleUser.email}
      <div class="google-info">
        <ProfileImg src="{currentGoogleUser.imageUrl}" />
        <span class="google-info-span">{currentGoogleUser.name}</span>
        <span class="google-info-span">
          <span class="email">{currentGoogleUser.email}</span>
        </span>
      </div>
    {/if}
    {#if shouldShowUsernameInput}
      <H2>👋 Welcome!</H2>
      <H3>
        <span class="choose-username-info">
          Just one more step before we continue
        </span>
        <span class="choose-username-info">Choose a filbert username.</span>
      </H3>
      <div class="input-container">
        <label for="username" class:error="{error || usernameIsInvalid}">
          filbert username (lowercase letters a-z and numbers 0-9 only, length 5
          to 42 characters)
        </label>
        <input
          class:error="{error || usernameIsInvalid}"
          bind:value="{usernameValue}"
          bind:this="{usernameInputDomNode}"
          name="username"
          type="text"
          autoComplete="off"
          minLength="5"
          maxLength="42"
        />
      </div>
    {/if}
    {#if isAdminLogin}
      <div class="input-container">
        <label for="username-admin" class:error="{error}">
          filbert username
        </label>
        <input
            class:error="{error}"
            bind:value="{usernameValue}"
            bind:this="{usernameAdminInputDomNode}"
            name="username-admin"
            type="text"
            autoComplete="off"
            minLength="5"
            maxLength="42"
        />
      </div>
      <div class="input-container">
        <label for="password" class:error="{error}">
          password
        </label>
        <input
            class:error="{error || usernameIsInvalid}"
            bind:value="{usernameValue}"
            name="password"
            type="password"
        />
      </div>
      {/if}
    <div class="message-container">
      {#if error}
        <span class="error">
          Try again. {error}{' '}
          <span role="img" aria-label="male police officer">👮</span>
        </span>
      {:else if success}
        <span class="success">{success}</span>
      {/if}
    </div>
    <ButtonSpinner
      id="sign-in-button"
      type="submit"
      primary
      label={signinButtonLabel}
      loading="{signinLoading}"
    >
      {#if !isAdminLogin}
        <GoogleLogoSvg />
      {/if}
    </ButtonSpinner>
    {#if !shouldShowUsernameInput && currentGoogleUser.givenName}
      <button
        class="filbert-nav-button cancel"
        type="button"
        on:click="{doLogout}"
      >
        <span class="button-span">Logout</span>
      </button>
    {:else}
      <a class="filbert-link-alt" href="/">
        <button class="filbert-nav-button cancel">
          <span class="button-span">Cancel</span>
        </button>
      </a>
    {/if}
    {#if isAdminLogin}
      <a href="/signin" class="filbert-link">Google signin</a>
      {:else}
      <a href="/signin?admin" class="filbert-link">admin signin</a>
      {/if}
  </form>
</section>
