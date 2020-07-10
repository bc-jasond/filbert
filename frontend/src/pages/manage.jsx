import React, { useEffect, useRef, useState } from 'react';
import { fromJS, Map } from 'immutable';
import { Redirect } from 'react-router-dom';
import styled, { css } from 'styled-components';
import Image from '../common/components/image';

import { Article } from '../common/components/layout-styled-components';
import {
  NODE_TYPE_IMAGE,
  PAGE_NAME_VIEW,
  POST_ACTION_REDIRECT_TIMEOUT,
} from '../common/constants';
import { ease } from '../css';
import { focusAndScrollSmooth, getNextFromUrl } from '../common/dom';
import { apiDelete, apiGet, apiPatch, apiPost } from '../common/fetch';
import {
  Button,
  ButtonSpan,
  CancelButton,
  Col,
  Col9,
  DeleteButton,
  ErrorMessage,
  FlexGrid,
  FlexGrid9,
  H1Styled,
  H2Styled,
  Input,
  InputContainer,
  Label,
  MessageContainer,
  SuccessMessage,
  TextArea,
} from '../common/components/shared-styled-components';
import Toggle from '../common/components/toggle';
import {
  codeFontFamily,
  getVar,
  grey,
  viewport12,
  viewport7,
} from '../variables.css';
import EditImageForm from './edit/components/edit-image-form';

import {
  confirmPromise,
  formatPostDate,
  getMapWithId,
  nodeIsValid,
} from '../common/utils';
import Page404 from './404';
import Footer from './footer';
import Header from './header';

const MiddleWrapper = styled.div`
  width: 100%;
  margin: 0;
  padding: 0;
  @media (min-width: ${viewport7}) {
    width: 75%;
    margin: 0 auto;
    padding: 0 20px 40px 20px;
  }
  @media (min-width: ${viewport12}) {
    width: 50%;
  }
`;
const InputContainerStyled = styled(InputContainer)`
  opacity: 1;
  ${ease('opacity')};
  ${(p) =>
    p.shouldHide &&
    css`
      opacity: 0.4;
    `}
`;
const ImageContainer = styled(InputContainerStyled)`
  display: block;
`;
const ImageStyled = styled(Image)`
  margin: 0;
  max-height: 378px;
`;
const ToggleWrapper = styled.div`
  padding: 0 16px 8px;
`;
const ToggleLabel = styled.span`
  flex-grow: 2;
  font-family: ${getVar(codeFontFamily)}, monospaced;
  color: ${grey};
  font-size: 18px;
  line-height: 24px;
`;

export default React.memo(
  ({ params, session, setSession, font, toggleFont, theme, toggleTheme }) => {
    const inputRef = useRef(null);

    const backupTitleRef = useRef(null);

    const backupAbstractRef = useRef(null);

    const backupImageNodeRef = useRef(null);

    const imageContainerId = 'manage-post-image-container';

    const [post, setPost] = useState(Map());
    const [postSummary, setPostSummary] = useState(Map());
    const [errorObj, setErrorObj] = useState(null);
    const [successMessage, setSuccessMessage] = useState(null);
    const [imageMenuOffsetTop, setImageMenuOffsetTop] = useState(0);
    const [imageMenuOffsetLeft, setImageMenuOffsetLeft] = useState(0);
    const [imageIsSelected, setImageIsSelected] = useState(
      !post.getIn(['meta', 'syncTopPhoto'])
    );
    const [shouldShow404, setShouldShow404] = useState(false);
    const [redirectUrl, setRedirectUrl] = useState(false);

    function syncTitleAndAbstract(postLocal, postSummaryLocal) {
      const current = postLocal.getIn(['meta', 'syncTitleAndAbstract']);
      if (current) {
        return postLocal
          .set('title', postSummaryLocal.get('title'))
          .set('abstract', postSummaryLocal.get('abstract'));
      }
      return postLocal
        .set('title', backupTitleRef.current)
        .set('abstract', backupAbstractRef.current);
    }

    function syncImage(postLocal, postSummaryLocal) {
      const current = postLocal.getIn(['meta', 'syncTopPhoto']);
      if (current) {
        return postLocal.setIn(
          ['meta', 'imageNode'],
          postSummaryLocal.get('imageNode')
        );
      }
      return backupImageNodeRef.current?.size
        ? postLocal.setIn(['meta', 'imageNode'], backupImageNodeRef.current)
        : postLocal;
    }

    async function loadPost(postId) {
      const {
        error,
        data: { post: postLocal },
      } = await apiGet(`/manage/${postId}`);
      if (error) {
        console.error(error);
        return null;
      }
      return postLocal;
    }
    async function loadPostSummary(postId) {
      const { error, data: postSummaryLocal } = await apiGet(
        `/post-summary/${postId}`
      );
      if (error) {
        console.error(error);
        return null;
      }
      return postSummaryLocal;
    }

    useEffect(() => {
      async function loadPostAndSummary() {
        // eslint-disable-next-line prefer-const
        let postLocal = await loadPost(params?.id);
        if (!postLocal) {
          setShouldShow404(true);
          return;
        }
        postLocal = fromJS(postLocal);
        backupTitleRef.current = postLocal.get('title', '');
        backupAbstractRef.current = postLocal.get('abstract', '');
        backupImageNodeRef.current =
          postLocal.getIn(['meta', 'imageNode']) || Map();

        let postSummaryLocal = await loadPostSummary(params?.id);
        if (!postSummaryLocal) {
          // TODO: show error message?
          return;
        }

        postSummaryLocal = fromJS(postSummaryLocal);
        postLocal = syncTitleAndAbstract(postLocal, postSummaryLocal);
        postLocal = syncImage(postLocal, postSummaryLocal);
        setPost(postLocal);
        setPostSummary(postSummaryLocal);
        setShouldShow404(false);
      }
      loadPostAndSummary();
      focusAndScrollSmooth(null, inputRef?.current);
    }, [params]);

    useEffect(() => {
      function positionImageMenu() {
        const elem = document.getElementById(imageContainerId);
        const imageMenuOffsetTopLocal = elem?.offsetTop - 60;
        const imageMenuOffsetLeftLocal =
          elem?.offsetLeft - 8 + elem?.offsetWidth / 2;
        setImageMenuOffsetTop(imageMenuOffsetTopLocal);
        setImageMenuOffsetLeft(imageMenuOffsetLeftLocal);
      }
      positionImageMenu();
      window.addEventListener('resize', positionImageMenu);
      return () => {
        window.removeEventListener('resize', positionImageMenu);
      };
    });

    function updatePost(postLocal) {
      setPost(postLocal);
      setErrorObj(null);
      setSuccessMessage(null);
    }

    function toggleTitleAndAbstract() {
      const current = post.getIn(['meta', 'syncTitleAndAbstract']);
      let updatedPost = post.setIn(['meta', 'syncTitleAndAbstract'], !current);
      updatedPost = syncTitleAndAbstract(updatedPost, postSummary);
      updatePost(updatedPost);
    }

    function toggleImage() {
      const current = post.getIn(['meta', 'syncTopPhoto']);
      let updatedPost = post.setIn(['meta', 'syncTopPhoto'], !current);
      updatedPost = syncImage(updatedPost, postSummary);
      updatePost(updatedPost);
    }

    async function savePost() {
      const { error } = await apiPatch(`/post/${post.get('id')}`, {
        title: post.get('title'),
        canonical: post.get('canonical'),
        abstract: post.get('abstract'),
        meta: post.get('meta'),
      });
      if (error) {
        setSuccessMessage(null);
        setErrorObj(error);
        return { error };
      }
      setSuccessMessage(true);
      setErrorObj(null);
      setTimeout(() => setSuccessMessage(null), POST_ACTION_REDIRECT_TIMEOUT);
      return {};
    }

    async function publishPost() {
      const didConfirm = await confirmPromise(
        'Publish this post?  This makes it public.'
      );
      if (!didConfirm) {
        return;
      }
      // Save the post first
      let error;
      ({ error } = await savePost());
      if (error) {
        setErrorObj(error);
        return;
      }
      // manage second
      ({ error } = await apiPost(`/publish/${post.get('id')}`));
      if (error) {
        setErrorObj(error);
        return;
      }
      setSuccessMessage(true);
      setErrorObj(null);

      setTimeout(
        () => setRedirectUrl(`/p/${post.get('canonical')}`),

        POST_ACTION_REDIRECT_TIMEOUT
      );
    }

    async function deletePost() {
      const draftType = post.get('published') ? 'post' : 'draft';
      const didConfim = await confirmPromise(
        `Delete ${draftType} ${post.get('title')}?`
      );
      if (!didConfim) {
        return;
      }
      const { error } = await apiDelete(`/${draftType}/${post.get('id')}`);
      if (error) {
        console.error(`Delete ${draftType} error:`, error);
        return;
      }
      if (post.get('published')) {
        setRedirectUrl('/public');
        return;
      }
      setRedirectUrl(getNextFromUrl());
    }

    function updateImage(imageNode) {
      let imageNodeUpdated = imageNode;
      if (!nodeIsValid(imageNode)) {
        imageNodeUpdated = imageNode.merge(
          getMapWithId({ type: NODE_TYPE_IMAGE })
        );
      }
      setPost(post.setIn(['meta', 'imageNode'], imageNodeUpdated));
    }

    const imageNode = post.getIn(['meta', 'imageNode']) || Map();
    const shouldSyncTitleAndAbstract = post.getIn([
      'meta',
      'syncTitleAndAbstract',
    ]);
    const shouldSyncTopPhoto = post.getIn(['meta', 'syncTopPhoto']);

    if (shouldShow404) return <Page404 session={session} />;
    if (redirectUrl) return <Redirect to={redirectUrl} />;

    return (
      post.size > 0 && (
        <>
          <Header
            session={session}
            setSession={setSession}
            font={font}
            toggleFont={toggleFont}
            theme={theme}
            toggleTheme={toggleTheme}
            post={post}
            pageName={PAGE_NAME_VIEW}
          />
          <Article>
            <H1Styled>
              Manage{post.get('published') ? ' Post' : ' Draft'}
            </H1Styled>
            <H2Styled>Edit Listing Details, Publish & Delete</H2Styled>
            <FlexGrid>
              <Col>
                <InputContainerStyled shouldHide={shouldSyncTitleAndAbstract}>
                  <Label htmlFor="title" error={errorObj?.title}>
                    title
                  </Label>
                  <Input
                    name="title"
                    type="text"
                    value={post.get('title')}
                    disabled={shouldSyncTitleAndAbstract && 'disabled'}
                    onChange={(e) => {
                      updatePost(post.set('title', e.target.value));
                    }}
                    error={errorObj?.title}
                    ref={inputRef}
                  />
                </InputContainerStyled>
                <InputContainerStyled shouldHide={post.get('published')}>
                  <Label htmlFor="canonical" error={errorObj?.canonical}>
                    canonical
                  </Label>
                  <Input
                    name="canonical"
                    type="text"
                    value={post.get('canonical')}
                    disabled={post.get('published') && 'disabled'}
                    onChange={(e) => {
                      updatePost(post.set('canonical', e.target.value));
                    }}
                    error={errorObj?.canonical}
                  />
                </InputContainerStyled>
                <InputContainerStyled shouldHide={shouldSyncTitleAndAbstract}>
                  <Label htmlFor="abstract" error={errorObj?.abstract}>
                    abstract
                  </Label>
                  <TextArea
                    name="abstract"
                    type="text"
                    value={post.get('abstract')}
                    disabled={shouldSyncTitleAndAbstract && 'disabled'}
                    onChange={(e) => {
                      updatePost(post.set('abstract', e.target.value));
                    }}
                    error={errorObj?.abstract}
                  />
                </InputContainerStyled>
              </Col>
              <Col>
                <ImageContainer
                  id={imageContainerId}
                  shouldHide={shouldSyncTopPhoto}
                  onClick={() => setImageIsSelected(!imageIsSelected)}
                >
                  <Label htmlFor="imageNode" error={errorObj?.imageNode}>
                    image
                  </Label>
                  {imageNode.size > 0 && (
                    <ImageStyled
                      node={imageNode}
                      isEditing={!shouldSyncTopPhoto && imageIsSelected}
                      hideCaption
                    />
                  )}
                </ImageContainer>
              </Col>
            </FlexGrid>
            <MiddleWrapper>
              <ToggleWrapper>
                <Toggle
                  value={shouldSyncTitleAndAbstract}
                  onUpdate={toggleTitleAndAbstract}
                >
                  <ToggleLabel>
                    Keep Title and Abstract in sync with top 2 sections of
                    content?
                  </ToggleLabel>
                </Toggle>
              </ToggleWrapper>
              <ToggleWrapper>
                <Toggle value={shouldSyncTopPhoto} onUpdate={toggleImage}>
                  <ToggleLabel>
                    Keep Image in sync with first Photo in content?
                  </ToggleLabel>
                </Toggle>
              </ToggleWrapper>
              <MessageContainer>
                {errorObj && (
                  <ErrorMessage>
                    Error:{` ${Object.values(errorObj).join('')}`}
                    <span role="img" aria-label="woman shrugging">
                      🤷 ‍
                    </span>
                  </ErrorMessage>
                )}
                {successMessage && (
                  <SuccessMessage>
                    Saved{' '}
                    <span role="img" aria-label="thumbs up">
                      👍
                    </span>
                  </SuccessMessage>
                )}
              </MessageContainer>
              <FlexGrid9>
                <Col9>
                  <Button onClick={savePost}>
                    <ButtonSpan>Save</ButtonSpan>
                  </Button>
                </Col9>
                <Col9>
                  <Button
                    onClick={publishPost}
                    disabled={post.get('published') && 'disabled'}
                  >
                    <ButtonSpan>{`${
                      post.get('published')
                        ? `Published on ${formatPostDate(
                            post.get('published')
                          )}`
                        : 'Publish'
                    }`}</ButtonSpan>
                  </Button>
                </Col9>
                <Col9>
                  <DeleteButton onClick={deletePost}>
                    <ButtonSpan>Delete</ButtonSpan>
                  </DeleteButton>
                </Col9>
                <Col9>
                  <CancelButton
                    onClick={() => {
                      setRedirectUrl(getNextFromUrl());
                    }}
                  >
                    <ButtonSpan>Done</ButtonSpan>
                  </CancelButton>
                </Col9>
              </FlexGrid9>
            </MiddleWrapper>
            {!shouldSyncTopPhoto && imageIsSelected && (
              <EditImageForm
                shouldHideCaption
                offsetTop={imageMenuOffsetTop}
                offsetLeft={imageMenuOffsetLeft}
                post={post}
                nodeModel={imageNode}
                update={updateImage}
              />
            )}
          </Article>
          <Footer />
        </>
      )
    );
  }
);
