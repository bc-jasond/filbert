import React from 'react';
import { fromJS, Map } from 'immutable';
import { Redirect } from 'react-router-dom';
import styled, { css } from 'styled-components';
import Image from '../common/components/image';

import { Article } from '../common/components/layout-styled-components';
import {
  PAGE_NAME_VIEW,
  POST_ACTION_REDIRECT_TIMEOUT
} from '../common/constants';
import { ease, grey, viewport12, viewport7 } from '../common/css';
import { focusAndScrollSmooth, getNextFromUrl } from '../common/dom';
import { apiDelete, apiGet, apiPatch, apiPost } from '../common/fetch';
import { monospaced } from '../common/fonts.css';
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
  TextArea
} from '../common/components/shared-styled-components';
import Toggle from '../common/components/toggle';

import { confirmPromise, formatPostDate } from '../common/utils';
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
  ${p =>
    p.shouldHide &&
    css`
      opacity: 0.4;
    `}
`;
const ImageContainer = styled(InputContainerStyled)`
  display: block;
`;
const ToggleWrapper = styled.div`
  padding: 0 16px 8px;
`;
const ToggleLabel = styled.span`
  flex-grow: 2;
  font-family: ${monospaced}, monospaced;
  color: ${grey};
  font-size: 18px;
  line-height: 24px;
`;

export default class Publish extends React.Component {
  inputRef = React.createRef();

  backupTitle;

  backupAbstract;

  backupImageNode;

  constructor(props) {
    super(props);
    this.state = {
      post: Map(),
      postSummary: {},
      error: null,
      successMessage: null,
      shouldShow404: false,
      redirectUrl: false
    };
  }

  async componentDidMount() {
    await this.loadPostAndSummary();
    focusAndScrollSmooth(null, this.inputRef?.current);
  }

  async componentDidUpdate(prevProps) {
    const params = this.props?.params;
    const id = params?.id;
    const prevId = prevProps?.params?.id;
    if (id === prevId) {
      return;
    }
    await this.loadPostAndSummary();
  }

  // eslint-disable-next-line react/sort-comp
  async loadPostSummary() {
    const { error, data: postSummary } = await apiGet(
      `/post-summary/${this.props?.params?.id}`
    );
    if (error) {
      console.error(error);
      return {};
    }
    return postSummary;
  }

  async loadPostAndSummary() {
    // eslint-disable-next-line prefer-const
    let { errorPost, data: { post } = {} } = await apiGet(
      `/publish/${this.props?.params?.id}`
    );
    if (errorPost) {
      console.error(errorPost);
      this.setState({ shouldShow404: true });
      return;
    }
    post = fromJS(post);
    this.backupTitle = post.get('title', '');
    this.backupAbstract = post.get('abstract', '');
    this.backupImageNode = post.getIn(['meta', 'imageNode'], Map());
    const postSummary = fromJS(await this.loadPostSummary());
    post = this.syncTitleAndAbstract(post, postSummary);
    post = this.syncImage(post, postSummary);
    this.setState({ post, postSummary, shouldShow404: false });
  }

  syncTitleAndAbstract(post, postSummary) {
    const current = post.getIn(['meta', 'syncTitleAndAbstract']);
    if (current) {
      return post
        .set('title', postSummary.get('title'))
        .set('abstract', postSummary.get('abstract'));
    }
    return post
      .set('title', this.backupTitle)
      .set('abstract', this.backupAbstract);
  }

  syncImage(post, postSummary) {
    const current = post.getIn(['meta', 'syncTopPhoto']);
    if (current) {
      return post.setIn(['meta', 'imageNode'], postSummary.get('imageNode'));
    }
    return this.backupImageNode.size
      ? post.setIn(['meta', 'imageNode'], this.backupImageNode)
      : post;
  }

  toggleTitleAndAbstract = () => {
    const {
      state: { post, postSummary }
    } = this;
    const current = post.getIn(['meta', 'syncTitleAndAbstract']);
    let updatedPost = post.setIn(['meta', 'syncTitleAndAbstract'], !current);
    updatedPost = this.syncTitleAndAbstract(updatedPost, postSummary);
    this.updatePost(updatedPost);
  };

  toggleImage = () => {
    const {
      state: { post, postSummary }
    } = this;
    const current = post.getIn(['meta', 'syncTopPhoto']);
    let updatedPost = post.setIn(['meta', 'syncTopPhoto'], !current);
    updatedPost = this.syncImage(updatedPost, postSummary);
    this.updatePost(updatedPost);
  };

  updatePost = post => {
    this.setState({
      post,
      error: null,
      successMessage: null
    });
  };

  savePost = async () => {
    const {
      state: { post }
    } = this;
    const { error } = await apiPatch(`/post/${post.get('id')}`, {
      title: post.get('title'),
      canonical: post.get('canonical'),
      abstract: post.get('abstract'),
      meta: post.get('meta')
    });
    if (error) {
      this.setState({
        successMessage: null,
        error
      });
      return { error };
    }
    this.setState(
      {
        successMessage: true,
        error: null
      },
      () => {
        setTimeout(
          () => this.setState({ successMessage: null }),
          POST_ACTION_REDIRECT_TIMEOUT
        );
      }
    );
    return {};
  };

  publishPost = async () => {
    const {
      state: { post }
    } = this;

    const didConfirm = await confirmPromise(
      'Publish this post?  This makes it public.'
    );
    if (!didConfirm) {
      return;
    }
    let error;
    ({ error } = await this.savePost());
    if (error) {
      this.setState({ error });
      return;
    }
    ({ error } = await apiPost(`/publish/${post.get('id')}`));
    if (error) {
      this.setState({ error });
      return;
    }
    this.setState(
      {
        successMessage: true,
        error: null
      },
      () => {
        setTimeout(
          () =>
            this.setState({
              redirectUrl: `/p/${post.get('canonical')}`
            }),
          POST_ACTION_REDIRECT_TIMEOUT
        );
      }
    );
  };

  deletePost = async () => {
    const {
      state: { post }
    } = this;
    if (post.get('published')) {
      const didConfim = await confirmPromise(
        `Delete post ${post.get('title')}?`
      );
      if (!didConfim) {
        return;
      }
      const { error } = await apiDelete(`/post/${post.get('id')}`);
      if (error) {
        console.error('Delete post error:', error);
        return;
      }
      this.setState({ redirectUrl: '/' });
      return;
    }
    const didConfirm = await confirmPromise(
      `Delete draft ${post.get('title')}?`
    );
    if (!didConfirm) {
      return;
    }
    const { error } = await apiDelete(`/draft/${post.get('id')}`);
    if (error) {
      console.error('Delete draft error:', error);
      return;
    }
    this.setState({ redirectUrl: '/' });
  };

  render() {
    const {
      props: { session, setSession },
      state: { post, redirectUrl, error, successMessage, shouldShow404 }
    } = this;
    const syncTitleAndAbstract = post.getIn(['meta', 'syncTitleAndAbstract']);
    const syncTopPhoto = post.getIn(['meta', 'syncTopPhoto']);

    if (shouldShow404) return <Page404 session={session} />;
    if (redirectUrl) return <Redirect to={redirectUrl} />;

    return (
      post.size > 0 && (
        <>
          <Header
            session={session}
            setSession={setSession}
            post={post}
            pageName={PAGE_NAME_VIEW}
          />
          <Article>
            <H1Styled>
              Publish{post.get('published') ? ' Post' : ' Draft'}
            </H1Styled>
            <H2Styled>Edit Listing Details, Publish & Delete</H2Styled>
            <FlexGrid>
              <Col>
                <InputContainerStyled
                  shouldHide={post.getIn(['meta', 'syncTitleAndAbstract'])}
                >
                  <Label htmlFor="title" error={error?.title}>
                    title
                  </Label>
                  <Input
                    name="title"
                    type="text"
                    value={post.get('title')}
                    disabled={
                      post.getIn(['meta', 'syncTitleAndAbstract']) && 'disabled'
                    }
                    onChange={e => {
                      this.updatePost(post.set('title', e.target.value));
                    }}
                    error={error?.title}
                    ref={this.inputRef}
                  />
                </InputContainerStyled>
                <InputContainerStyled shouldHide={post.get('published')}>
                  <Label htmlFor="canonical" error={error?.canonical}>
                    canonical
                  </Label>
                  <Input
                    name="canonical"
                    type="text"
                    value={post.get('canonical')}
                    disabled={post.get('published') && 'disabled'}
                    onChange={e => {
                      this.updatePost(post.set('canonical', e.target.value));
                    }}
                    error={error?.canonical}
                  />
                </InputContainerStyled>
                <InputContainerStyled
                  shouldHide={post.getIn(['meta', 'syncTitleAndAbstract'])}
                >
                  <Label htmlFor="abstract" error={error?.abstract}>
                    abstract
                  </Label>
                  <TextArea
                    name="abstract"
                    type="text"
                    value={post.get('abstract')}
                    disabled={
                      post.getIn(['meta', 'syncTitleAndAbstract']) && 'disabled'
                    }
                    onChange={e => {
                      this.updatePost(post.set('abstract', e.target.value));
                    }}
                    error={error?.abstract}
                  />
                </InputContainerStyled>
              </Col>
              <Col>
                <ImageContainer
                  shouldHide={post.getIn(['meta', 'syncTopPhoto'])}
                >
                  <Label htmlFor="imageNode" error={error?.imageNode}>
                    image
                  </Label>
                  {post.getIn(['meta', 'imageNode']) && (
                    <Image
                      node={post.getIn(['meta', 'imageNode'])}
                      hideBorder
                    />
                  )}
                </ImageContainer>
              </Col>
            </FlexGrid>
            <MiddleWrapper>
              <ToggleWrapper>
                <Toggle
                  value={syncTitleAndAbstract}
                  onUpdate={this.toggleTitleAndAbstract}
                >
                  <ToggleLabel>
                    Keep Title and Abstract in sync with top 2 sections of
                    content?
                  </ToggleLabel>
                </Toggle>
              </ToggleWrapper>
              <ToggleWrapper>
                <Toggle value={syncTopPhoto} onUpdate={this.toggleImage}>
                  <ToggleLabel>
                    Keep Image in sync with first Photo in content?
                  </ToggleLabel>
                </Toggle>
              </ToggleWrapper>
              <MessageContainer>
                {error && (
                  <ErrorMessage>
                    Error:{` ${Object.values(error).join('')}`}
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
                  <Button onClick={this.savePost}>
                    <ButtonSpan>Save</ButtonSpan>
                  </Button>
                </Col9>
                <Col9>
                  <Button
                    onClick={this.publishPost}
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
                  <DeleteButton onClick={this.deletePost}>
                    <ButtonSpan>Delete</ButtonSpan>
                  </DeleteButton>
                </Col9>
                <Col9>
                  <CancelButton
                    onClick={() => {
                      this.setState({ redirectUrl: getNextFromUrl() });
                    }}
                  >
                    <ButtonSpan>Done</ButtonSpan>
                  </CancelButton>
                </Col9>
              </FlexGrid9>
            </MiddleWrapper>
          </Article>
          <Footer />
        </>
      )
    );
  }
}
