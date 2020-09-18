<script context="module">
  import { usernameIsValid } from '../../common/utils';
  import { getApiClientInstance } from '../../common/api-client';

  export async function preload({ path, params: { username } }, session) {
    if (!usernameIsValid(username)) {
      this.error(404, 'Not found');
      return;
    }
    const usernameWithoutAt = username.slice(1);
    const { error, data: user } = await getApiClientInstance(this.fetch).get(
      `/user/${usernameWithoutAt}`
    );
    if (error || !user) {
      this.error(error.status, error.statusText);
      return;
    }
    const userIsMe = session?.user?.username === usernameWithoutAt;
    if (!user.statsArePublic && !userIsMe) {
      return { user, userIsMe };
    }
    const { error: statsError, data: stats } = await getApiClientInstance(
      this.fetch
    ).get(`/user-stats/${usernameWithoutAt}`);
    if (statsError) {
      this.error(statsError.status, statsError.statusText);
      return;
    }
    return { user, userIsMe, stats };
  }
</script>

<script>
  import {
    formatNumber,
    formatPostDate,
    formatStreakDate,
  } from 'filbert/src/common/utils';

  export let user = {};
  export let userIsMe;
  export let stats = {};

  const statsFormatted = !stats.totalPosts
    ? []
    : [
        {
          key: 'since',
          label: 'Member Since:',
          figure: formatPostDate(user.created),
        },
        {
          key: 'streak',
          label: 'Current Streak:',
          figure:
            stats.currentStreak > 0
              ? `${stats.currentStreak} days`
              : `0 days 👩🏽‍💻 smash that 'new' button!`,
        },
        {
          key: 'streak-longest',
          label: 'Longest Streak:',
          figure: stats.longestStreak,
        },
        // {key: 'cadence', label: 'Publishing Cadence:', figure: 'every TODO days'},
        {
          key: 'favorite',
          label: 'Favorite Words:',
          figure: stats.favoriteWords,
        },
        {
          key: 'avg-length',
          label: 'Avg Post Length:',
          figure: `${formatNumber(stats.averagePostWordLength)} words`,
        },
        {
          key: 'longest',
          label: 'Longest Post:',
          figure: `${formatNumber(stats.longestPostWords)} words`,
        },
        {
          key: 'total-chars',
          label: '# of Characters:',
          figure: formatNumber(stats.totalCharacters),
        },
        {
          key: 'total-words',
          label: '# of Words Total:',
          figure: formatNumber(stats.totalWords),
        },
        {
          key: 'total-posts',
          label: '# of Posts Total:',
          figure: formatNumber(stats.totalPosts),
        },
        {
          key: 'total-published',
          label: '# of Posts Published:',
          figure: formatNumber(stats.totalPostsPublished),
        },
        {
          key: 'total-images',
          label: '# of Images:',
          figure: formatNumber(stats.totalImages),
        },
        {
          key: 'total-quotes',
          label: '# of Quotes:',
          figure: formatNumber(stats.totalQuotes),
        },
      ];

  import H1 from '../../document-components/H1.svelte';
  import H2 from '../../document-components/H2.svelte';
  import Bold from '../../document-components/format-components/Bold.svelte';
  import ProfileImg from '../../user-components/ProfileImg.svelte';
  import ExpandLink from '../../layout-components/ExpandLink.svelte';
  import Toggle from '../../form-components/Toggle.svelte';

  function updateProfilePublic() {
    user = { ...user, profileIsPublic: !user.profileIsPublic };
    getApiClientInstance(fetch).patch('/profile', {
      profileIsPublic: user.profileIsPublic,
    });
  }

  function updateStatsArePublic() {
    user = { ...user, statsArePublic: !user.statsArePublic };
    getApiClientInstance(fetch).patch('/profile', {
      statsArePublic: user.statsArePublic,
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
  .table {
    display: flex;
    flex-flow: row wrap;
    border-radius: 4px;
    border: 1px solid var(--filbert-lightGrey);
  }
  .table-cell {
    box-sizing: border-box;
    flex-grow: 1;
    width: 50%;
    overflow: hidden;
    padding: 4px 8px;
    border: 1px solid var(--filbert-lightGrey);
  }
  code {
    background: none;
    padding: 0;
    margin: 0;
  }
</style>

<svelte:head>
  <title>filbert | {user.username}</title>
</svelte:head>

<H1>User Profile</H1>
<div class="filbert-section">
  <div class="row">
    <div class="col">
      {#if user.pictureUrl}
        <ProfileImg
          src="{user.pictureUrl}"
          height="144px"
          width="144px"
          shouldApplyHoverStyle
        />
      {/if}
    </div>
    <div class="col right">
      <H2 noMargin>{user.givenName} {user.familyName}</H2>
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
  <div class="filbert-section">
    <H2>Stats</H2>
    <div class="table">
      {#each statsFormatted as { key, label, figure }}
        <div class="table-cell">
          <code class="code-text">{label}</code>
        </div>
        <div class="table-cell filbert-alt-font">
          {#if key === 'favorite'}
            {#each figure as { word, count }}
              <div>
                <Bold shouldFormat>{word}</Bold>
                used {formatNumber(count)} times
              </div>
            {/each}
          {:else if key === 'streak-longest'}
            {stats.longestStreak} days
            <div>
              {formatStreakDate(stats.longestStreakStart)} to {formatStreakDate(stats.longestStreakEnd)}
            </div>
          {:else}{figure}{/if}
        </div>
      {/each}
    </div>
  </div>
{/if}
