import React from 'react';
import { List, Map } from 'immutable';
import styled from 'styled-components';
import {
  NODE_TYPE_CODE,
  NODE_TYPE_ITALIC,
  NODE_TYPE_LI,
  NODE_TYPE_LINK,
  NODE_TYPE_OL,
  NODE_TYPE_P,
  NODE_TYPE_A,
  NODE_TYPE_SECTION_CODE,
  NODE_TYPE_SECTION_CONTENT,
  NODE_TYPE_SECTION_H1,
  NODE_TYPE_SECTION_H2,
  NODE_TYPE_SECTION_IMAGE,
  NODE_TYPE_SECTION_QUOTE,
  NODE_TYPE_SECTION_SPACER,
  NODE_TYPE_SECTION_POSTLINK,
  NODE_TYPE_SITEINFO,
  NODE_TYPE_STRIKE,
  NODE_TYPE_TEXT,
  NODE_TYPE_ROOT,
  ZERO_LENGTH_CHAR,
} from './constants';
import {
  H1,
  H2,
  ContentSection,
  SpacerSection,
  CodeSection,
  P,
  QuoteP,
  Pre,
  A,
  Ol,
  Li,
  LinkStyled,
  SiteInfo,
  StrikeText,
  ItalicText,
  MiniText,
  Code,
  Figure,
  ImagePlaceholderContainer,
  ImagePlaceholderFill,
  Img,
  FigureCaption,
  ImageSection,
} from './shared-styled-components';
import { cleanTextOrZeroLengthPlaceholder } from './utils';

const StyledDiv = styled.div``;

export default class ContentNode extends React.PureComponent {
  constructor(props) {
    super(props);
  }
  
  getTagFromType(type = null) {
    const { node } = this.props;
    switch (type || node.get('type')) {
      // ROOT TYPE
      case NODE_TYPE_ROOT:
        return StyledDiv;
      // SECTION TYPES
      case NODE_TYPE_SECTION_H1:
        return H1;
      case NODE_TYPE_SECTION_H2:
        return H2;
      case NODE_TYPE_SECTION_CONTENT:
        return ContentSection;
      // PARAGRAPH TYPES
      case NODE_TYPE_P:
        return P;
      case NODE_TYPE_OL:
        return Ol;
      case NODE_TYPE_LI:
        return Li;
      case NODE_TYPE_SITEINFO:
        return SiteInfo;
      case NODE_TYPE_STRIKE:
        return StrikeText;
      case NODE_TYPE_ITALIC:
        return ItalicText;
      case NODE_TYPE_CODE:
        return Code;
      default:
        throw new Error(`unknown type: ${node.get('type')}`);
    }
  }
  
  getChildNodes() {
    const {
      node,
      nodesByParentId,
      isEditing,
    } = this.props;
    console.debug('getChildNodes', nodesByParentId.get(node.get('id')))
    return nodesByParentId
      .get(node.get('id'), List([Map({ type: NODE_TYPE_TEXT, id: 'foo', content: ZERO_LENGTH_CHAR })]))
      .map(child => (<ContentNode key={child.get('id')} node={child} nodesByParentId={nodesByParentId} isEditing={isEditing} />))
  }
  
  getKey() {
    const {
      node,
      nodesByParentId,
    } = this.props;
    console.debug('getKey', nodesByParentId.get(node.get('id')))
    return nodesByParentId
      .get(node.get('id'), List([Map()]))
      // create a key from all child ids catenated together - this is to fix a stale render issue for TEXT (invisible to the DOM) children
      .reduce((acc, child) => `${child.get('id')}`, '')
  }
  
  getSelection(selection) {
    const getTagNames = (selection) => selection
      .get('types', List())
      .filter(type => type)
      .map(selectionType => this.getTagFromType(selectionType));
    const getContent = (selection) => node
      .get('content', '')
      .substring(selection.get('start'), selection.get('end'));
    return (
      <React.Fragment>
      
      </React.Fragment>
    )
  }
  
  render() {
    const {
      node,
      isEditing,
    } = this.props;
    switch (node.get('type')) {
      /**
       * NON-RECURSIVE SECTIONS
       */
      case NODE_TYPE_SECTION_SPACER:
        return (<SpacerSection data-type={NODE_TYPE_SECTION_SPACER} name={node.get('id')} contentEditable={false} />);
      case NODE_TYPE_SECTION_CODE:
        const lines = node
          .get('meta', Map())
          .get('lines', List());
        return (
          <CodeSection data-type={node.get('type')} name={node.get('id')} >
            {lines.map((line, idx) => (<Pre key={`${node.get('id')}-${idx}`} name={`${node.get('id')}-${idx}`}>{cleanTextOrZeroLengthPlaceholder(line)}</Pre>))}
          </CodeSection>
        );
      case NODE_TYPE_SECTION_IMAGE: {
        const meta = node.get('meta', Map());
        return (
          <ImageSection data-type={NODE_TYPE_SECTION_IMAGE} name={node.get('id')} contentEditable={false}>
            <Figure>
              <ImagePlaceholderContainer w={meta.get('width')} h={meta.get('height')}>
                <ImagePlaceholderFill w={meta.get('width')} h={meta.get('height')} />
                <Img
                  isEditing={isEditing}
                  onClick={() => {
                    if (!isEditing) return;
                    isEditing(node.get('id'))}
                  }
                  src={meta.get('url')}
                />
              </ImagePlaceholderContainer>
              <FigureCaption>{meta.get('caption')}</FigureCaption>
            </Figure>
          </ImageSection>
        );
      }
      case NODE_TYPE_SECTION_QUOTE: {
        const meta = node.get('meta', Map());
        return (
          <ContentSection data-type={NODE_TYPE_SECTION_QUOTE} name={node.get('id')} contentEditable={false}>
            <QuoteP
              isEditing={isEditing}
              onClick={() => {
                if (!isEditing) return;
                isEditing(node.get('id'))}
              }
            >
              {'💡Remember: '}
              <ItalicText>
                {meta.get('quote') && `"${meta.get('quote')}" `}
                <A href={meta.get('url')}>{meta.get('author') && `-${meta.get('author')}`}</A>
                <MiniText>{meta.get('context') && ` ${meta.get('context')}`}</MiniText>
              </ItalicText>
            </QuoteP>
          </ContentSection>
        );
      }
      // TODO: remove this, add post-to-post linking part of a 'smart' A tag, hard-code the next/prev post into the layout
      case NODE_TYPE_SECTION_POSTLINK: {
        const to = node.get('meta', Map()).get('to');
        const Centered = styled.div`
          text-align: center;
        `;
        const PLarger = styled(P)`
          font-size: larger;
        `;
        return (
          <Centered>
            <ContentSection>
              <PLarger><SiteInfo>Thanks for reading</SiteInfo></PLarger>
            </ContentSection>
            {to && (
              <H2>
                Next Post: <LinkStyled to={to}>{node.get('content')}</LinkStyled>
              </H2>
            )}
            <H2>
              👈 <LinkStyled to="/posts">Back to all Posts</LinkStyled>
            </H2>
          </Centered>
        );
      }
      case NODE_TYPE_LINK:
        return (
          <LinkStyled to={node.get('content')} data-type={node.get('type')} name={node.get('id')}>
            {this.getChildNodes()}
          </LinkStyled>
        );
      case NODE_TYPE_A:
        return (
          <A href={node.get('content')} data-type={node.get('type')} name={node.get('id')}>
            {this.getChildNodes()}
          </A>
        );
      
      /**
       * PARAGRAPH TYPES
       */
      default:
        const StyledComponent = this.getTagFromType();
        if (!StyledComponent) return null;
        const selections = node
          .get('meta', Map())
          .get('selections', List());
        
        return (
          <StyledComponent key={this.getKey()} data-type={node.get('type')} name={node.get('id')} isEditing={isEditing}>
            {selections.map(selection => (
              
              ))}
          </StyledComponent>
        )
    }
  }
}

// opinionated section nodes - can't have children
// these could be interesting in the editor 'add' menu but, they're currently supported with existing node types
// export const Gotcha = {} // facepalm emoji
// export const Tangent = {} // horse emoji
// export const Shrug = {} // shrug emoji

