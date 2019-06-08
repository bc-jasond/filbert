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

function s4() {
  return Math.floor((1 + Math.random()) * 0x10000)
    .toString(16)
    .substring(1);
}

// TODO: this is a placeholder to be able to set the caret in an empty tag

export class BlogPostNode {
  constructor({ type, id, parent_id, post_id, content, meta }, parent = null) {
    this.type = type;
    this.id = id || s4();
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
  
  getNextSibling() {
    if (!this.parent
      || this.parent.childNodes.indexOf(this) === this.parent.childNodes.size - 1) {
      return null;
    }
    const idx = this.parent.childNodes.indexOf(this);
    return this.parent.childNodes.get(idx + 1);
  }
  
  deleteChildNode(node) {
    const idx = this.childNodes.indexOf(node);
    if (idx > -1) {
      this.childNodes.delete(idx);
      return true;
    }
    return false;
  }
  
  findById(id) {
    const queue = [this];
    while (queue.length) {
      const current = queue.pop();
      if (current.id === id) {
        return current;
      }
      if (current.childNodes.size) {
        queue.unshift(...current.childNodes.toArray())
      }
    }
    return null;
  }
  
  getKey() {
  
  }
  
  updateContent(content) {
    let textNode;
    if (this.childNodes.size === 0) {
      textNode = new BlogPostNode({ type: NODE_TYPE_TEXT }, this);
    } else {
      // TODO: fix this - assume there's only one child and it's a text node
      textNode = this.childNodes.get(0);
      this.childNodes.delete(0);
    }
    textNode.content = content;
    this.childNodes = this.childNodes.push(textNode);
  }
  
  toJSON() {
    const raw = { ...this };
    delete (raw.parent); // prevent circular reference issue
    // raw.childNodes = raw.childNodes.map(child => child.toJson());
    return raw;
  }
  
  render() {
    switch (this.type) {
      /**
       * SPECIAL TYPES
       */
      case NODE_TYPE_ROOT:
        return (
          <div data-type="root" name={this.id}>
            {this.childNodes.map(node => node.render())}
          </div>
        );
      case NODE_TYPE_TEXT:
        return this.content;
      case NODE_TYPE_LI:
        return (<Li>{this.childNodes.map(node => node.render())}</Li>);
      /**
       * SECTIONS
       */
      case NODE_TYPE_SECTION_SPACER:
        return (<SpacerSection />);
      case NODE_TYPE_SECTION_H1:
        return (
          <H1 data-type="h1" name={this.id}>
            {this.childNodes.map(node => node.render())}
          </H1>
        );
      case NODE_TYPE_SECTION_H2:
        return (<H2>{this.childNodes.map(node => node.render())}</H2>);
      case NODE_TYPE_SECTION_CONTENT:
        return (<ContentSection data-type="content"
                                name={this.id}>{this.childNodes.map(node => node.render())}</ContentSection>);
      case NODE_TYPE_SECTION_CODE:
        const { lines } = this.meta;
        return (
          <CodeSection>
            {lines.map((line, idx) => (<Pre key={idx}>{line}</Pre>))}
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
      case NODE_TYPE_SECTION_POSTLINK: {
        const { to } = this.meta;
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
                Next Post: <LinkStyled to={to}>{this.content}</LinkStyled>
              </H2>
            )}
            <H2>
              👈 <LinkStyled to="/posts">Back to all Posts</LinkStyled>
            </H2>
          </Centered>
        );
      }
      /**
       * FORMATTING TYPES
       */
      case NODE_TYPE_CODE:
        return (<Code>{this.content}</Code>);
      case NODE_TYPE_P:
        return (
          <P data-type="p" name={this.id}>
            {this.childNodes.map(node => node.render())}
          </P>
        );
      case NODE_TYPE_OL:
        return (<Ol>{this.childNodes.map(node => node.render())}</Ol>);
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

