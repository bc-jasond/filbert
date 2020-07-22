<script context="module">
  import { fromJS } from 'immutable';

  import { API_URL } from '../../common/constants';
  import { formatPostDate, reviver } from '../../common/utils';
  import { loading } from '../../stores';

  export async function preload(page, session, preloading) {
    const { path, params, query } = page;
    loading.set(true);
    const response = await this.fetch(`${API_URL}/post/${params.post}`)
    const payload = await response.json();
    loading.set(false);
    const { prevPost, nextPost, post, contentNodes } = payload;
    prevPost.published = formatPostDate(prevPost.published);
    nextPost.published = formatPostDate(nextPost.published);
    post.published = formatPostDate(post.published);
    return { post: fromJS(post), nodesById: fromJS(contentNodes, reviver) };
  }
</script>

<script>
  // export let routeInfo;
  // export let session;
  export let post;
  export let nodesById;
  // export let prevPost;
  // export let nextPost;

  import PostDetailsSection from '../../post-components/PostDetails.svelte';
  import PostAvatar from '../../post-components/PostAvatar.svelte';
  import Document from '../../document-components/Document.svelte';
</script>

<style>

</style>

  <PostDetailsSection>
    <PostAvatar {post} showHandle />
  </PostDetailsSection>
  <Document nodesById={nodesById} />
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
