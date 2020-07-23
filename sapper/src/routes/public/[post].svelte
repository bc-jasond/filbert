<script context="module">
  import { fromJS } from 'immutable';

  import { API_URL } from '../../common/constants';
  import { formatPostDate, reviver } from '../../common/utils';
  import { loading } from '../../stores';

  export function preload(page, session, preloading) {
    const { path, params, query } = page;
    loading.set(true);

    const responsePromise = this.fetch(`${API_URL}/post/${params.post}`)
        .then(response => response.json())
        .then(( { prevPost, nextPost, post, contentNodes } ) => {
          prevPost.published = formatPostDate(prevPost.published);
          nextPost.published = formatPostDate(nextPost.published);
          post.published = formatPostDate(post.published);
          return { post: fromJS(post), nodesById: fromJS(contentNodes, reviver) };
        })
        .finally(() => loading.set(false))

    return {
      responsePromise,
    };
  }
</script>

<script>
  export let responsePromise;

  import PostDetailsSection from '../../post-components/PostDetails.svelte';
  import PostAvatar from '../../post-components/PostAvatar.svelte';
  import Document from '../../document-components/Document.svelte';
</script>

{#await responsePromise}
  <p>...post</p>
{:then {post, nodesById}}
  <PostDetailsSection>
    <PostAvatar {post} showHandle />
  </PostDetailsSection>
  <Document nodesById={nodesById} />
{:catch error}
  <p style="color: red">{error.message}</p>
{/await}


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
