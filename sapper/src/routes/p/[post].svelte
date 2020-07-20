<script context="module">
  import { fromJS } from 'immutable';

  import { API_URL } from '../../common/constants';
  import { formatPostDate, reviver } from '../../common/utils';

  export async function preload(page, session) {
    const { path, params, query } = page;

    const response = await this.fetch(`${API_URL}/post/${params.post}`)
    const payload = await response.json();
    const { prevPost, nextPost, post, contentNodes } = payload;
    prevPost.published = formatPostDate(prevPost.published);
    nextPost.published = formatPostDate(nextPost.published);
    post.published = formatPostDate(post.published);
    return { routeInfo: page, session, post: fromJS(post), nodesById: fromJS(contentNodes, reviver), prevPost, nextPost };
  }
</script>

<script>
  // export let routeInfo;
  // export let session;
  export let post;
  // export let nodesById;
  // export let prevPost;
  // export let nextPost;

  import PostDetailsSection from '../../post-components/post-details.svelte';
  import PostAvatar from '../../post-components/post-avatar.svelte';
</script>

<style>
  article {
    width: 100%;
    min-height: 80vh;
    padding: 16px 24px 48px 24px;
    margin: 0 auto;
    box-sizing: border-box;
    position: relative;
  }

  @media (min-width: 992px) {
    article {
      padding: 48px 80px;
    }
  }
</style>

<article>
  <PostDetailsSection>
    <PostAvatar {post} showHandle />
  </PostDetailsSection>

  <!--&lt;!&ndash;  <Document nodesById={nodesById} />&ndash;&gt;-->
  <!--  <PrevNextPostSection>-->
  <!--  <SiteInfoStyled>-->
  <!--  <ThanksForReading>Thanks for reading</ThanksForReading>-->
  <!--  <span role="img" aria-label="peace sign">-->
  <!--  ✌🏼-->
  <!--  </span>-->
  <!--  </SiteInfoStyled>-->
  <!--  <FlexGrid>-->
  <!--  <NextPostNav post={prevPost} isPrevious />-->
  <!--  <NextPostNav post={nextPost} />-->
  <!--  </FlexGrid>-->
  <!--  </PrevNextPostSection>-->
</article>