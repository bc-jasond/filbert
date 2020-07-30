<script>
  import ButtonSpinner from '../form-components/ButtonSpinner.svelte';

  import ProfileImg from '../user-components/ProfileImg.svelte';
  import H1 from '../document-components/H1.svelte';
  import H2 from '../document-components/H2.svelte';
  import H3 from '../document-components/H3.svelte';
  import GoogleLogoSvg from '../icons/google-logo.svelte';

  function doLoginGoogle() {}

  function doLogout() {}

  function updateUsername(event) {
    const {
      target: { value },
    } = event;
    username = value.replace(/[^0-9a-z]/g, '');
  }

  let usernameInputDomNode;
  let imageUrl;
  let name;
  let email;
  let username;
  let givenName;
  let shouldShowUsernameInput = true;
  let error;
  let success;
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
    font-family: inherit;
    color: var(--filbert-success);
  }

  .error {
    font-family: inherit;
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
</style>

<section>
  <form on:submit="{doLoginGoogle}">
    <div class="centered">
      <H1>Sign In</H1>
    </div>
    {#if imageUrl && name && email}
      <div class="google-info">
        <ProfileImg src="{imageUrl}" />
        <span class="google-info-span">{name}</span>
        <span class="google-info-span">
          <span class="email">{email}</span>
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
        <label htmlFor="username" class:error>
          filbert username (lowercase letters a-z and numbers 0-9 only, length 5
          to 42 characters)
        </label>
        <input
          name="username"
          type="text"
          value="{username}"
          on:input="{updateUsername}"
          class:error
          bind:this="{usernameInputDomNode}"
          autoComplete="off"
          minLength="5"
          maxLength="42"
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
      id="google-sign-in-button"
      type="submit"
      primary
      label="{givenName || shouldShowUsernameInput ? `Continue as ${shouldShowUsernameInput ? username : givenName}` : 'Sign in to filbert with Google'}"
    >
      <GoogleLogoSvg />
    </ButtonSpinner>
    {#if !shouldShowUsernameInput && givenName}
      <button
        class="filbert-nav-button cancel"
        type="button"
        onClick="{doLogout}"
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
  </form>
</section>
