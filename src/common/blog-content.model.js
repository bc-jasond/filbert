import React from 'react';
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

class BlogPostNode {
  constructor({ type, id, parent_id, post_id, content, meta }, parent = null) {
    this.type = type;
    this.id = id;
    this.parent_id = parent_id;
    this.post_id = post_id;
    this.content = content;
    this.meta = meta;
    
    this.parent = parent;
    this.childNodes = [];
  }
  
  canHaveChildren() {
    return ![
      NODE_TYPE_CODE,
      NODE_TYPE_SECTION_CODE,
      NODE_TYPE_SECTION_IMAGE,
      NODE_TYPE_SECTION_QUOTE,
      NODE_TYPE_SECTION_SPACER,
      NODE_TYPE_SECTION_POSTLINK,
      NODE_TYPE_TEXT,
    ].includes(this.type)
  }
  
  deleteChildNode(node) {
    const idx = this.childNodes.indexOf(node);
    if (idx > -1) {
      this.childNodes.splice(idx, 1);
      return true;
    }
    return false;
  }
  
  toJSON() {
    const raw = { ...this };
    delete (raw.parent); // prevent circular reference issue
    // raw.childNodes = raw.childNodes.map(child => child.toJson());
    return raw;
  }
  
  render() {
    switch (this.type) {
      case NODE_TYPE_ROOT:
        return (
          <React.Fragment>
            {this.childNodes.map(node => node.render())}
          </React.Fragment>
        );
      case NODE_TYPE_TEXT:
        return this.content;
      case NODE_TYPE_CODE:
        return (<Code>{this.content}</Code>);
      case NODE_TYPE_SECTION_SPACER:
        return (<SpacerSection />);
      case NODE_TYPE_SECTION_H1:
        return (<H1>{this.childNodes.map(node => node.render())}</H1>);
      case NODE_TYPE_SECTION_H2:
        return (<H2>{this.childNodes.map(node => node.render())}</H2>);
      case NODE_TYPE_SECTION_CONTENT:
        return (<ContentSection>{this.childNodes.map(node => node.render())}</ContentSection>);
      case NODE_TYPE_SECTION_CODE:
        const { lines } = this.meta;
        return (
          <CodeSection>
            {lines.map(line => (<Pre>{line}</Pre>))}
          </CodeSection>
        );
      case NODE_TYPE_SECTION_IMAGE: {
        const { width, height, url, caption } = this.meta;
        return (
          <ImageSection>
            <Figure>
              <ImagePlaceholderContainer w={width} h={height}>
                <ImagePlaceholderFill w={width} h={height} />
                <Img src={url} />
              </ImagePlaceholderContainer>
              <FigureCaption>{caption}</FigureCaption>
            </Figure>
          </ImageSection>
        );
      }
      case NODE_TYPE_SECTION_QUOTE: {
        const { quote, url, author, context } = this.meta;
        return (
          <ContentSection>
            <P>💡Remember: <ItalicText>{quote}<A href={url}>{author}</A>{context}
            </ItalicText></P>
          </ContentSection>
        );
      }
      case NODE_TYPE_P:
        return (<P>{this.childNodes.map(node => node.render())}</P>);
      case NODE_TYPE_OL:
        return (<Ol>{this.childNodes.map(node => node.render())}</Ol>);
      case NODE_TYPE_LI:
        return (<Li>{this.childNodes.map(node => node.render())}</Li>);
      case NODE_TYPE_LINK:
        return (<LinkStyled to={this.content}>{this.childNodes.map(node => node.render())}</LinkStyled>);
      case NODE_TYPE_A:
        return (<A href={this.content}>{this.childNodes.map(node => node.render())}</A>);
      case NODE_TYPE_SITEINFO:
        return (<SiteInfo>{this.childNodes.map(node => node.render())}</SiteInfo>);
      case NODE_TYPE_STRIKE:
        return (<StrikeText>{this.childNodes.map(node => node.render())}</StrikeText>);
      case NODE_TYPE_ITALIC:
        return (<ItalicText>{this.childNodes.map(node => node.render())}</ItalicText>);
      case NODE_TYPE_SECTION_POSTLINK: {
        const { to, content } = this.meta;
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
                Next Post: <LinkStyled to={to}>{content}</LinkStyled>
              </H2>
            )}
            <H2>
              👈 <LinkStyled to="/posts">Back to all Posts</LinkStyled>
            </H2>
          </Centered>
        );
      }
    }
  }
}

/**
 * Build up the blog post content DOM like model using BFS
 *
 * @param nodes - a hash of all content node data keyed off of parent_id
 * @returns BlogPostNode - the root node
 */
export function getContentTree(nodes) {
  const root = new BlogPostNode(nodes['null'][0]);
  let current;
  const queue = [root];
  
  while (queue.length) {
    current = queue.shift();
    const children = nodes[current.id] || [];
    children.forEach(node => {
      const childNode = new BlogPostNode(node, current);
      current.childNodes.push(childNode);
      queue.push(childNode);
    })
  }
  
  return root;
}

// opinionated section nodes - can't have children
// these could be interesting in the editor 'add' menu but, they're currently supported with existing node types
// export const Gotcha = {} // facepalm emoji
// export const Tangent = {} // horse emoji
// export const Shrug = {} // shrug emoji

