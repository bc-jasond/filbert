import React from 'react';
import { List, Map } from 'immutable';
import styled from 'styled-components';
import {
  NEW_POST_URL_ID,
  NODE_TYPE_P,
  NODE_TYPE_H1,
  NODE_TYPE_H2,
  NODE_TYPE_IMAGE,
  NODE_TYPE_QUOTE,
  NODE_TYPE_SPACER,
  NODE_TYPE_POSTLINK,
  NODE_TYPE_LI,
  NODE_TYPE_PRE,
  SELECTION_ACTION_STRIKETHROUGH,
  SELECTION_ACTION_SITEINFO,
  SELECTION_ACTION_ITALIC,
  SELECTION_ACTION_CODE,
  SELECTION_ACTION_BOLD,
  SELECTION_ACTION_LINK,
} from '../constants';
import {
  H1,
  H2,
  ContentSection,
  SpacerSection,
  CodeSection,
  P,
  QuoteP,
  Pre,
  Ol,
  Li,
  LinkStyled,
  A,
  ItalicText,
  MiniText,
  SiteInfo,
  Figure,
  ImagePlaceholderContainer,
  ImagePlaceholderFill,
  Img,
  FigureCaption,
  ImageSection,
  StrikeText,
  Code,
  BoldText,
} from './shared-styled-components';
import {
  cleanText,
  cleanTextOrZeroLengthPlaceholder,
  imageUrlIsId,
} from '../utils';
import {
  getContentForSelection,
  getSelectionKey,
} from '../../pages/edit/selection-helpers';

// TODO: is this wrapper div necessary?
const StyledDiv = styled.div``;

export default class Content extends React.Component {
  constructor(props) {
    super(props);
  }
  
  current;
  
  getNextPTags() {
    if (this.current.get('type') !== NODE_TYPE_P) {
      return;
    }
    const children = [];
    while (this.current.get('type') === NODE_TYPE_P) {
      children.push((
        <P data-type={this.current.get('type')} name={this.current.get('id')}>
          {this.getFormattedSelections(this.current)}
        </P>
      ))
      this.next()
    }
    return children;
  }
  getNextLiTags() {
    if (this.current.get('type') !== NODE_TYPE_LI) {
      return;
    }
    const children = [];
    while (this.current.get('type') === NODE_TYPE_LI) {
      children.push((
        <Li data-type={this.current.get('type')} name={this.current.get('id')}>
          {this.getFormattedSelections(this.current)}
        </Li>
      ))
      this.next()
    }
    return (<Ol>{children}</Ol>);
  }
  
  getContentSectionTags() {
    const children = [];
    let p;
    let li;
    do {
      p = this.getNextPTags()
      li = this.getNextLiTags()
      if (p) {
        children.push(...p)
      }
      if (li) {
        children.push(li)
      }
    } while (p || li);
    return (<ContentSection>{children}</ContentSection>)
  }
  getNextPreTags() {
    const { nodesById } = this.props;
    const children = [];
    while (this.current.get('type') === NODE_TYPE_PRE) {
      children.push((<Pre key={`${this.current.get('id')}`}
                          data-type={NODE_TYPE_PRE}
                          name={`${this.current.get('id')}`}>{cleanTextOrZeroLengthPlaceholder(this.current.get('content'))}</Pre>))
      this.next()
    }
    return (<CodeSection>{children}</CodeSection>);
  }
  
  isFirstOfType(nodes, id) {
  
  }
  
  isLastOfType(nodes, id) {
  
  }
  
  getFirstNode() {
    const { nodesById } = this.props;
    const idSeen = new Set();
    const nextSeen = new Set();
    nodesById.forEach(node => {
      idSeen.add(node.get('id'));
      if (node.get('next_sibling_id')) {
        nextSeen.add(node.get('next_sibling_id'));
      }
    })
    const difference = new Set([...idSeen].filter(id => !nextSeen.has(id)))
    const [first] = [...difference];
    return nodesById.get(first);
  }
  
  getFormattedSelections(node) {
    const selections = node.getIn(['meta', 'selections'], List([Map()]));
    let children = [];
    selections.forEach((selection) => {
      try {
        const key = getSelectionKey(selection);
        let selectionJsx = getContentForSelection(node, selection);
      
        if (selection.get(SELECTION_ACTION_STRIKETHROUGH)) {
          selectionJsx = (<StrikeText key={key}>{selectionJsx}</StrikeText>)
        }
        if (selection.get(SELECTION_ACTION_SITEINFO)) {
          selectionJsx = (<SiteInfo key={key}>{selectionJsx}</SiteInfo>)
        }
        if (selection.get(SELECTION_ACTION_ITALIC)) {
          selectionJsx = (<ItalicText key={key}>{selectionJsx}</ItalicText>)
        }
        if (selection.get(SELECTION_ACTION_CODE)) {
          selectionJsx = (<Code key={key}>{selectionJsx}</Code>)
        }
        if (selection.get(SELECTION_ACTION_BOLD)) {
          selectionJsx = (<BoldText key={key}>{selectionJsx}</BoldText>)
        }
        if (selection.get(SELECTION_ACTION_LINK)) {
          selectionJsx = (<A key={key} href={selection.get('linkUrl')}>{selectionJsx}</A>)
        }
        children.push(selectionJsx);
      } catch (err) {
        console.warn(err);
        // selections got corrupt, just display unformatted text
        children = [node.get('content')];
      }
    })
    return children;
  }
  
  next() {
    this.current = this.props.nodesById.get(this.current.get('next_sibling_id')) || Map();
  }
  
  render() {
    console.debug("ContentNode RENDER", this);
    const {
      post,
      // this is a callback to the edit page, it passes a nodeId.
      // It's only for image & quote sections.  Maybe it could go?
      // TODO: add currentEditSectionId to show selected state (right now it's just on hover).
      // Maybe that can be computed somehow?
      isEditing,
    } = this.props;
    const children = [];
    this.current = this.getFirstNode();
    while (this.current.get('id')) {
      switch (this.current.get('type')) {
        case NODE_TYPE_P:
        case NODE_TYPE_LI: {
          children.push(this.getContentSectionTags());
          continue;
        }
        case NODE_TYPE_PRE: {
          children.push(this.getNextPreTags());
          continue;
        }
        case NODE_TYPE_H1: {
          children.push((<H1
            data-type={NODE_TYPE_H1}
            name={this.current.get('id')}
            shouldShowPlaceholder={
              post
              && post.get('id', 'new') === NEW_POST_URL_ID
              && this.current === this.getFirstNode()
              && cleanText(this.current.get('content', '')).length === 0
            }
          >
            {cleanTextOrZeroLengthPlaceholder(this.current.get('content'))}
          </H1>));
          this.next();
          continue;
        }
        case NODE_TYPE_H2: {
          children.push((<H2 data-type={NODE_TYPE_H2}
                      name={this.current.get('id')}>{cleanTextOrZeroLengthPlaceholder(this.current.get('content'))}</H2>));
          this.next();
          continue;
        }
        case NODE_TYPE_SPACER: {
          children.push((<SpacerSection data-type={NODE_TYPE_SPACER} name={this.current.get('id')} contentEditable={false} />));
          this.next();
          continue;
        }
        case NODE_TYPE_IMAGE: {
          const meta = this.current.get('meta', Map());
          const w = meta.get('width');
          const h = meta.get('height');
          const urlField = meta.get('url') || '';
          // construct our url from the hash OR assume 3rd party URL
          const url = imageUrlIsId(urlField)
            ? `${process.env.API_URL}/image/${urlField}`
            : urlField;
          const rotationDegrees = meta.get('rotationDegrees', 0);
          let heightOverride;
          // if the image is rotated left once or right once change the height of the image container
          // to the width of the image to cover the increased/decreased dimension after CSS transform
          if (rotationDegrees === 90 || rotationDegrees === 270) {
            // current max-width of an ImageSection is 1000px...
            heightOverride = Math.min(w, 1000);
          }
          children.push((
            <ImageSection data-type={NODE_TYPE_IMAGE} name={this.current.get('id')} contentEditable={false}>
              <Figure heightOverride={heightOverride}>
                <ImagePlaceholderContainer w={w} h={h}>
                  <ImagePlaceholderFill w={w} h={h} />
                  {urlField.length > 0 && (<Img
                    isEditing={isEditing}
                    onClick={() => {
                      if (!isEditing) return;
                      isEditing(this.current.get('id'))
                    }}
                    rotationDegrees={rotationDegrees}
                    src={url}
                  />)}
                </ImagePlaceholderContainer>
              </Figure>
              <FigureCaption>{meta.get('caption')}</FigureCaption>
            </ImageSection>
          ))
          this.next();
          continue;
        }
        case NODE_TYPE_QUOTE: {
          const id = this.current.get('id');
          const quote = this.current.getIn(['meta', 'quote'], '');
          const url = this.current.getIn(['meta', 'url'], '');
          const author = this.current.getIn(['meta', 'author'], '');
          const context = this.current.getIn(['meta', 'context'], '');
          children.push((
            <ContentSection data-type={NODE_TYPE_QUOTE} name={id} contentEditable={false}>
              <QuoteP
                isEditing={isEditing}
                onClick={() => {
                  if (!isEditing) return;
                  isEditing(id)
                }
                }
              >
                {'💡Remember: '}
                <ItalicText>
                  {quote && `"${quote}" `}
                  <A target="_blank" href={url}>{author && `-${author}`}</A>
                  <MiniText>{context && ` ${context}`}</MiniText>
                </ItalicText>
              </QuoteP>
            </ContentSection>
          ));
          this.next();
          continue;
        }
        // TODO: remove this, add post-to-post linking part of a 'smart' A tag, hard-code the next/prev post into the layout?
        case NODE_TYPE_POSTLINK: {
          const to = this.current.getIn(['meta', 'to']);
          const Centered = styled.div`
          text-align: center;
        `;
          const PLarger = styled(P)`
          font-size: larger;
        `;
          children.push((
            <Centered>
              <ContentSection>
                <PLarger><SiteInfo>Thanks for reading</SiteInfo></PLarger>
              </ContentSection>
              {to && (
                <H2>
                  Next Post 👉 <LinkStyled to={to}>{this.current.get('content')}</LinkStyled>
                </H2>
              )}
              <H2>
                👈 <LinkStyled to="/posts">Back to all Posts</LinkStyled>
              </H2>
            </Centered>
          ));
          this.next();
          continue;
        }
        default: {
          console.error('Error: Unknown type! ', this.current.get('type'));
        }
      }
    }
    return (
      <StyledDiv>{children}</StyledDiv>
    )
  }
}

// opinionated section nodes - can't have children
// these could be interesting in the editor 'add' menu but, they're currently supported with existing node types
// export const Gotcha = {} // facepalm emoji
// export const Tangent = {} // horse emoji
// export const Shrug = {} // shrug emoji

