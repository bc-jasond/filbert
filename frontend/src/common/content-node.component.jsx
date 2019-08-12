import React from 'react';
import { List, Map } from 'immutable';
import styled from 'styled-components';
import {
  NODE_TYPE_OL,
  NODE_TYPE_P,
  NODE_TYPE_SECTION_CODE,
  NODE_TYPE_SECTION_CONTENT,
  NODE_TYPE_SECTION_H1,
  NODE_TYPE_SECTION_H2,
  NODE_TYPE_SECTION_IMAGE,
  NODE_TYPE_SECTION_QUOTE,
  NODE_TYPE_SECTION_SPACER,
  NODE_TYPE_SECTION_POSTLINK,
  NODE_TYPE_ROOT,
  NODE_TYPE_LI,
  NODE_TYPE_PRE,
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
  Ol,
  Li,
  LinkStyled,
  A,
  ItalicText,
  MiniText,
  Figure,
  ImagePlaceholderContainer,
  ImagePlaceholderFill,
  Img,
  FigureCaption,
  ImageSection,
} from './shared-styled-components';
import LinkNode from './content-nodes/link';
import BoldNode from './content-nodes/bold';
import CodeNode from './content-nodes/code';
import ItalicNode from './content-nodes/italic';
import SiteInfoNode from './content-nodes/siteinfo';
import StrikethroughNode from './content-nodes/strikethrough';
import { cleanTextOrZeroLengthPlaceholder } from './utils';

const StyledDiv = styled.div``;

export default class ContentNode extends React.PureComponent {
  constructor(props) {
    super(props);
  }
  
  getSectionTagFromType(type = null) {
    const { node } = this.props;
    switch (type || node.get('type')) {
      case NODE_TYPE_ROOT:
        return StyledDiv;
      case NODE_TYPE_SECTION_CONTENT:
        return ContentSection;
      case NODE_TYPE_OL:
        return Ol;
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
      .get(node.get('id'), List())
      .map(child => (
        <ContentNode key={child.get('id')} node={child} nodesByParentId={nodesByParentId} isEditing={isEditing} />))
  }
  
  getKey() {
    const {
      node,
      nodesByParentId,
    } = this.props;
    console.debug('getKey', nodesByParentId.get(node.get('id')))
    return nodesByParentId
      .get(node.get('id'), List())
      // create a key from all child ids concatenated together - this is to fix a stale render issue for TEXT (invisible to the DOM) children
      .reduce((acc, child) => `${child.get('id')}`, '')
  }
  
  render() {
    const {
      node,
      isEditing,
    } = this.props;
    switch (node.get('type')) {
      /**
       * NON-RECURSIVE 'custom' SECTIONS
       */
      case NODE_TYPE_SECTION_H1:
        return (<H1 data-type={NODE_TYPE_SECTION_H1} name={node.get('id')}>{cleanTextOrZeroLengthPlaceholder(node.get('content'))}</H1>);
      case NODE_TYPE_SECTION_H2:
        return (<H2 data-type={NODE_TYPE_SECTION_H2} name={node.get('id')}>{cleanTextOrZeroLengthPlaceholder(node.get('content'))}</H2>);
      case NODE_TYPE_SECTION_SPACER:
        return (<SpacerSection data-type={NODE_TYPE_SECTION_SPACER} name={node.get('id')} contentEditable={false} />);
      case NODE_TYPE_SECTION_CODE:
        const lines = node
          .getIn(['meta', 'lines'], List([cleanTextOrZeroLengthPlaceholder('')]));
        return (
          <CodeSection data-type={node.get('type')} name={node.get('id')}>
            {lines.map((line, idx) => (<Pre key={`${node.get('id')}-${idx}`}
                                            data-type={NODE_TYPE_PRE}
                                            name={`${node.get('id')}-${idx}`}>{cleanTextOrZeroLengthPlaceholder(line)}</Pre>))}
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
                    isEditing(node.get('id'))
                  }}
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
                isEditing(node.get('id'))
              }
              }
            >
              {'💡Remember: '}
              <ItalicText>
                {meta.get('quote') && `"${meta.get('quote')}" `}
                <A target="_blank" href={meta.get('url')}>{meta.get('author') && `-${meta.get('author')}`}</A>
                <MiniText>{meta.get('context') && ` ${meta.get('context')}`}</MiniText>
              </ItalicText>
            </QuoteP>
          </ContentSection>
        );
      }
      // TODO: remove this, add post-to-post linking part of a 'smart' A tag, hard-code the next/prev post into the layout
      case NODE_TYPE_SECTION_POSTLINK: {
        const to = node.getIn(['meta', 'to']);
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
      /**
       * SECTION TYPES
       */
      case NODE_TYPE_ROOT:
      case NODE_TYPE_SECTION_CONTENT:
      case NODE_TYPE_OL: {
        const StyledComponent = this.getSectionTagFromType();
        return (
          <StyledComponent key={this.getKey()} data-type={node.get('type')} name={node.get('id')}>
            {this.getChildNodes()}
          </StyledComponent>
        )
      }
      /**
       * PARAGRAPH TYPES
       */
      default: {
        let StyledComponent;
        switch (node.get('type')) {
          case NODE_TYPE_P:
            StyledComponent = P;
            break;
          case NODE_TYPE_LI:
            StyledComponent = Li;
            break;
          default:
            console.error('Error: Unknown type! ', node.get('type'));
            return null;
        }
        const meta = node.get('meta', Map());
        const selections = meta
          .get('selections', List([Map()]));
        const getContentForSelection = (selection) => {
          let content = node.get('content');
          if (content === undefined || content === null) {
            content = '';
          }
          const startOffset = selection.get('start');
          const endOffset = selection.get('end');
          return cleanTextOrZeroLengthPlaceholder(content.substring(startOffset, endOffset));
        };
        
        return (
          <StyledComponent key={this.getKey()} data-type={node.get('type')} name={node.get('id')} isEditing={isEditing}>
            {selections.map((selection, idx) => (
              <LinkNode key={`${node.get('id')}-${idx}`} href={meta.get('href')} selection={selection}>
                <BoldNode selection={selection}>
                  <CodeNode selection={selection}>
                    <ItalicNode selection={selection}>
                      <SiteInfoNode selection={selection}>
                        <StrikethroughNode selection={selection}>
                          {getContentForSelection(selection)}
                        </StrikethroughNode>
                      </SiteInfoNode>
                    </ItalicNode>
                  </CodeNode>
                </BoldNode>
              </LinkNode>
            ))}
          </StyledComponent>
        )
      }
    }
  }
}

// opinionated section nodes - can't have children
// these could be interesting in the editor 'add' menu but, they're currently supported with existing node types
// export const Gotcha = {} // facepalm emoji
// export const Tangent = {} // horse emoji
// export const Shrug = {} // shrug emoji

