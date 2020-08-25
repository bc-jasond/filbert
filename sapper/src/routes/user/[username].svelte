<script context="module">
  import { usernameIsValid } from '../../common/utils';
  import { getApiClientInstance } from '../../common/api-client';

  export async function preload({ path, params: { username } }, session) {
    if (!usernameIsValid(username)) {
      this.error(404, 'Not found');
    }
    const usernameWithoutAt = username.slice(1);
    const { error, data: user } = await getApiClientInstance(this.fetch).get(
      `/user/${usernameWithoutAt}`
    );
    if (error) {
      this.error(error.status, error.statusText);
    }
    const userIsMe = session.user.username === usernameWithoutAt;
    return { user, userIsMe };
  }
</script>

<script>
  export let user = {};
  export let userIsMe;

  const stats = false;
  const statsFormatted = [];

  import H1 from '../../document-components/H1.svelte';
  import H2 from '../../document-components/H2.svelte';
  import ProfileImg from '../../user-components/ProfileImg.svelte';
  import ExpandLink from '../../layout-components/ExpandLink.svelte';
  import Toggle from '../../form-components/Toggle.svelte';

  function updateProfilePublic() {
    user = { ...user, profileIsPublic: !user?.profileIsPublic };
    getApiClientInstance(fetch).patch('/profile', {
      profileIsPublic: user?.profileIsPublic,
    });
  }

  function updateStatsArePublic() {
    user = { ...user, statsArePublic: !user?.statsArePublic };
    getApiClientInstance(fetch).patch('/profile', {
      statsArePublic: user?.statsArePublic,
    });
  }
</script>

<style>
  .row {
    display: flex;
    flex-direction: row;
  }
  .col {
    display: flex;
    flex-direction: column;
  }
  .right {
    margin-left: 16px;
    flex-grow: 2;
    justify-content: center;
  }
</style>

<svelte:head>
  <title>filbert | {user.username}</title>
</svelte:head>

<H1>User Profile</H1>
<div class="filbert-section">
  <div class="row">
    <div class="col">
      {#if user?.pictureUrl}
        <ProfileImg
          src="{user?.pictureUrl}"
          height="144px"
          width="144px"
          shouldApplyHoverStyle
        />
      {/if}
    </div>
    <div class="col right">
      <H2 noMargin>{user?.givenName} {user?.familyName}</H2>
      <ExpandLink bigger url="/public/?username={user.username}">
        {user.username}
      </ExpandLink>
    </div>
  </div>
</div>
{#if userIsMe}
  <div class="filbert-section">
    <H2>Settings</H2>
    <Toggle
      label="Make my profile public?"
      value="{user.profileIsPublic}"
      onUpdate="{updateProfilePublic}"
    />
    <Toggle
      disabled="{!user.profileIsPublic}"
      label="Make my stats public?"
      value="{user.statsArePublic}"
      onUpdate="{updateStatsArePublic}"
    />
  </div>
{/if}
{#if stats}
  <div class="content-section">
    <h2>Stats</h2>
    <div class="table">
      {#each statsFormatted as { key, label, figure }}
        <div class="table-cell">
          <code>{label}</code>
        </div>
        <div class="table-cell">{figure}</div>
      {/each}
    </div>
  </div>
{/if}
