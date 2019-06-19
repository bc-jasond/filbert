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
  Pre,
  A,
  Ol,
  Li,
  LinkStyled,
  SiteInfo,
  StrikeText,
  ItalicText,
  Code,
  Figure,
  ImagePlaceholderContainer,
  ImagePlaceholderFill,
  Img,
  FigureCaption,
  ImageSection,
} from './shared-styled-components';

const StyledDiv = styled.div``;

export default class ContentNode extends React.PureComponent {
  constructor(props) {
    super(props);
  }
  
  getTagFromType() {
    const { node } = this.props;
    switch (node.get('type')) {
      case NODE_TYPE_ROOT:
        return StyledDiv;
      case NODE_TYPE_SECTION_H1:
        return H1;
      case NODE_TYPE_SECTION_H2:
        return H2;
      case NODE_TYPE_SECTION_CONTENT:
        return ContentSection;
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
      default:
        throw new Error(`unknown type: ${node.get('type')}`);
    }
  }
  
  getChildNodes() {
    const {
      node,
      nodesByParentId,
    } = this.props;
    console.debug('getChildNodes', nodesByParentId.get(node.get('id')))
    return nodesByParentId
      .get(node.get('id'), List([Map({ type: NODE_TYPE_TEXT, id: 'foo', content: ZERO_LENGTH_CHAR })]))
      .map(child => (<ContentNode key={child.get('id')} node={child} nodesByParentId={nodesByParentId} />))
  }
  
  getKey() {
    const {
      node,
      nodesByParentId,
    } = this.props;
    console.debug('getKey', nodesByParentId.get(node.get('id')))
    return nodesByParentId
      .get(node.get('id'), List([Map({ type: NODE_TYPE_TEXT, id: 'foo', content: ZERO_LENGTH_CHAR })]))
      // create a key from all child ids catenated together - this is to fix a stale render issue for TEXT (invisible to the DOM) children
      .reduce((acc, child) => `${child.get('id')}`, '')
  }
  
  render() {
    const {
      node,
    } = this.props;
    switch (node.get('type')) {
      /**
       * NON-RECURSIVE SECTIONS
       */
      case NODE_TYPE_SECTION_SPACER:
        return (<SpacerSection data-type={node.get('type')} name={node.get('id')} />);
      case NODE_TYPE_SECTION_CODE:
        const lines = node
          .get('meta', Map())
          .get('lines', List());
        return (
          <CodeSection>
            {lines.map((line, idx) => (<Pre key={idx}>{line}</Pre>))}
          </CodeSection>
        );
      case NODE_TYPE_SECTION_IMAGE: {
        const meta = node.get('meta', Map());
        return (
          <ImageSection>
            <Figure>
              <ImagePlaceholderContainer w={meta.get('width')} h={meta.get('height')}>
                <ImagePlaceholderFill w={meta.get('width')} h={meta.get('height')} />
                <Img src={meta.get('url')} />
              </ImagePlaceholderContainer>
              <FigureCaption>{meta.get('caption')}</FigureCaption>
            </Figure>
          </ImageSection>
        );
      }
      case NODE_TYPE_SECTION_QUOTE: {
        const meta = node.get('meta', Map());
        return (
          <ContentSection>
            <P>💡Remember: <ItalicText>{meta.get('quote')}<A
              href={meta.get('url')}>{meta.get('author')}</A>{meta.get('context')}
            </ItalicText></P>
          </ContentSection>
        );
      }
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
       * BASE CONTENT TYPES
       */
      case NODE_TYPE_CODE:
        return (<Code>{node.get('content')}</Code>);
      case NODE_TYPE_TEXT:
        return node.get('content');
      
      /**
       * RECURSIVE TYPES WITH CHILDREN
       */
      default:
        const StyledComponent = this.getTagFromType();
        if (!StyledComponent) return null;
        
        return (
          <StyledComponent key={this.getKey()} data-type={node.get('type')} name={node.get('id')}>
            {this.getChildNodes()}
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

