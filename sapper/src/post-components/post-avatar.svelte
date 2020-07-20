<script>
  export let post;
  export let showHandle;
  export let postIsPrivate;

  import ProfileImg from '../user-components/profile-img.svelte';
  import AuthorExpand from '../user-components/author-expand.svelte';
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
      <ProfileImg src={post.get('profilePictureUrl')} height="40px" width="40px" shouldApplyHoverStyle />
    </a>
  {/if}
  <div class="list-avatar-content">
    {#if post.get('userProfileIsPublic') || postIsPrivate}
      <div><a class="filbert-link list-avatar-content-row" href="/@{post.get('username')}">
        {post.get('givenName')} {post.get('familyName')}
      </a></div>
    {/if}
    <div class="meta-font-mixin list-avatar-content-row italic">
      {postIsPrivate ? post.get('updated') : post.get('published')}
    </div>
    {#if showHandle}
      <div class="meta-font-mixin list-avatar-content-row">
        <AuthorExpand username={post.get('username')} />
      </div>
    {/if}
  </div>
</div>