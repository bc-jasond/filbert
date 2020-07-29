<script>
  export let post;
  export let showHandle = false;
  export let postIsPrivate = false;

  import ProfileImg from '../user-components/ProfileImg.svelte';
  import ExpandLink from '../layout-components/ExpandLink.svelte';
</script>

<style>
  .list-avatar {
    display: flex;
    align-items: center;
  }

  .list-avatar-content {
    display: flex;
    flex-direction: column;
  }

  .list-avatar-content-row {
    min-height: 18px;
    font-family: var(--filbert-sans-serif);
  }

  .italic {
    font-family: var(--filbert-italic-serif), sans-serif;
    color: var(--text-color-secondary);
  }
</style>

<div class="list-avatar">
  {#if post.get('userProfileIsPublic') || postIsPrivate}
    <a href="/@{post.get('username')}">
      <ProfileImg
        src="{post.get('profilePictureUrl')}"
        height="40px"
        width="40px"
        shouldApplyHoverStyle
      />
    </a>
  {/if}
  <div class="list-avatar-content">
    {#if post.get('userProfileIsPublic') || postIsPrivate}
      <div>
        <a
          class="filbert-link list-avatar-content-row"
          href="/@{post.get('username')}"
        >
          {post.get('givenName')} {post.get('familyName')}
        </a>
      </div>
    {/if}
    <div class="meta-font list-avatar-content-row italic">
      {postIsPrivate ? post.get('updated') : post.get('published')}
    </div>
    {#if showHandle}
      <div class="meta-font list-avatar-content-row">
        <ExpandLink url="/public/?username={post.get('username')}">
          @{post.get('username')}
        </ExpandLink>
      </div>
    {/if}
  </div>
</div>
