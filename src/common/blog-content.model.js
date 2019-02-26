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
  NODE_TYPE_SECTION_H2, NODE_TYPE_SECTION_IMAGE, NODE_TYPE_SECTION_QUOTE,
  NODE_TYPE_SECTION_SPACER,
  NODE_TYPE_SITEINFO,
  NODE_TYPE_STRIKE,
  NODE_TYPE_TEXT, NODE_TYPE_SECTION_POSTLINK
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
  constructor(type, childNodes = [], content = '', id = '') {
    this.type = type;
    this.childNodes = childNodes;
    this.content = content;
    this.id = id;
  }
}

export class NodeText extends BlogPostNode {
  constructor(content) {
    super(NODE_TYPE_TEXT, [], content);
  }

  render() {
    return this.content;
  }
}

export class NodeCode extends BlogPostNode {
  constructor(content) {
    super(NODE_TYPE_CODE, [], content);
  }

  render() {
    return (<Code>{this.content}</Code>)
  }
}

export class NodeSpacer extends BlogPostNode {
  constructor() {
    super(NODE_TYPE_SECTION_SPACER);
  }

  render() {
    return (<SpacerSection />)
  }
}

export class NodeH1 extends BlogPostNode {
  constructor(childNodes) {
    super(NODE_TYPE_SECTION_H1, childNodes);
  }

  render() {
    return (<H1>{this.childNodes.map(node => node.render())}</H1>)
  }
}

export class NodeH2 extends BlogPostNode {
  constructor(childNodes) {
    super(NODE_TYPE_SECTION_H2, childNodes);
  }

  render() {
    return (<H2>{this.childNodes.map(node => node.render())}</H2>)
  }
}

export class NodeContent extends BlogPostNode {
  constructor(childNodes) {
    super(NODE_TYPE_SECTION_CONTENT, childNodes);
  }

  render() {
    return (<ContentSection>{this.childNodes.map(node => node.render())}</ContentSection>)
  }
}

export class NodeCodeSection extends BlogPostNode {
  constructor(lines) {
    super(NODE_TYPE_SECTION_CODE);
    this.lines = lines;
  }

  render() {
    return (
      <CodeSection>
        {this.lines.map(line => (<Pre>{line}</Pre>))}
      </CodeSection>
    )
  }
}

export class NodeImage extends BlogPostNode {
  constructor(width, height, url, caption) {
    super(NODE_TYPE_SECTION_IMAGE);
    this.width = width;
    this.height = height;
    this.url = url;
    this.caption = caption;
  }

  render() {
    return (
      <ImageSection>
        <Figure>
          <ImagePlaceholderContainer w={this.width} h={this.height}>
            <ImagePlaceholderFill w={this.width} h={this.height} />
            <Img src={this.url} />
          </ImagePlaceholderContainer>
          <FigureCaption>{this.caption}</FigureCaption>
        </Figure>
      </ImageSection>
    )
  }
}

export class NodeQuote extends BlogPostNode {
  constructor(quote, author, url, context) {
    super(NODE_TYPE_SECTION_QUOTE);
    this.quote = quote;
    this.author = author;
    this.url = url;
    this.context = context;
  }

  render() {
    return (
      <ContentSection>
        <P>💡Remember: <ItalicText>{this.quote}<A href={this.url}>{this.author}</A>{this.context}
        </ItalicText></P>
      </ContentSection>
    )
  }
}

export class NodePostLink extends BlogPostNode {
  constructor(to, content) {
    super(NODE_TYPE_SECTION_POSTLINK);
    this.to = to;
    this.content = content;
  }

  render() {
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
        {this.to && (
          <H2>
            Next Post: <LinkStyled to={this.to}>{this.content}</LinkStyled>
          </H2>
        )}
        <H2>
          👈 <LinkStyled to="/posts">Back to all Posts</LinkStyled>
        </H2>
      </Centered>
    )
  }
}

export class NodeP extends BlogPostNode {
  constructor(childNodes) {
    super(NODE_TYPE_P, childNodes);
  }

  render() {
    return (<P>{this.childNodes.map(node => node.render())}</P>)
  }
}

export class NodeOl extends BlogPostNode {
  constructor(childNodes) {
    super(NODE_TYPE_OL, childNodes);
  }

  render() {
    return (<Ol>{this.childNodes.map(node => node.render())}</Ol>)
  }
}

export class NodeLi extends BlogPostNode {
  constructor(childNodes) {
    super(NODE_TYPE_LI, childNodes);
  }

  render() {
    return (<Li>{this.childNodes.map(node => node.render())}</Li>)
  }
}

export class NodeLink extends BlogPostNode {
  constructor(childNodes, content) {
    super(NODE_TYPE_LINK, childNodes, content);
  }

  render() {
    return (<LinkStyled to={this.content}>{this.childNodes.map(node => node.render())}</LinkStyled>)
  }
}

export class NodeA extends BlogPostNode {
  constructor(childNodes, content) {
    super(NODE_TYPE_A, childNodes, content);
  }

  render() {
    return (<A href={this.content}>{this.childNodes.map(node => node.render())}</A>)
  }
}

export class NodeSiteInfo extends BlogPostNode {
  constructor(childNodes) {
    super(NODE_TYPE_SITEINFO, childNodes);
  }

  render() {
    return (<SiteInfo>{this.childNodes.map(node => node.render())}</SiteInfo>)
  }
}

export class NodeStrike extends BlogPostNode {
  constructor(childNodes) {
    super(NODE_TYPE_STRIKE, childNodes);
  }

  render() {
    return (<StrikeText>{this.childNodes.map(node => node.render())}</StrikeText>)
  }
}

export class NodeItalic extends BlogPostNode {
  constructor(childNodes) {
    super(NODE_TYPE_ITALIC, childNodes);
  }

  render() {
    return (<ItalicText>{this.childNodes.map(node => node.render())}</ItalicText>)
  }
}

export class BlogPost {
  constructor(canonical, sections = [], id = '', tags = []) {
    this.canonical = canonical; // permalink, human readable
    this.sections = sections; // [ BlogPostNode, ]
    this.id = id; // int or hash
    this.tags = tags; // for later?
  }

  toJson() {
    // recursively write out a React Component tree to JSON for storage
  }

  render() {
    return (
      <React.Fragment>
        {this.sections.map(node => node.render())}
      </React.Fragment>
    );
  }
}

export function nodeFromJson(data) {
  const {
    type,
    childNodes,
    content,
    // for code section
    lines,
    // for image
    width,
    height,
    url, // also for quote
    caption,
    // for quote
    quote,
    author,
    context,
    // for postlink
    to,
  } = data;
  // create the new node
  let newNode;
  switch (type) {
    case NODE_TYPE_TEXT:
      newNode = new NodeText(content);
      break;
    case NODE_TYPE_CODE:
      newNode = new NodeCode(content);
      break;
    case NODE_TYPE_SECTION_H1:
      newNode = new NodeH1();
      break;
    case NODE_TYPE_SECTION_H2:
      newNode = new NodeH2();
      break;
    case NODE_TYPE_SECTION_SPACER:
      newNode = new NodeSpacer();
      break;
    case NODE_TYPE_SECTION_CONTENT:
      newNode = new NodeContent();
      break;
    case NODE_TYPE_SECTION_CODE:
      newNode = new NodeCodeSection(lines);
      break;
    case NODE_TYPE_SECTION_IMAGE:
      newNode = new NodeImage(width, height, url, caption);
      break;
    case NODE_TYPE_SECTION_QUOTE:
      newNode = new NodeQuote(quote, author, url, context);
      break;
    case NODE_TYPE_SECTION_POSTLINK:
      newNode = new NodePostLink(to, content);
      break;
    case NODE_TYPE_P:
      newNode = new NodeP();
      break;
    case NODE_TYPE_OL:
      newNode = new NodeOl();
      break;
    case NODE_TYPE_LI:
      newNode = new NodeLi();
      break;
    case NODE_TYPE_LINK:
      newNode = new NodeLink([], content);
      break;
    case NODE_TYPE_A:
      newNode = new NodeA([], content);
      break;
    case NODE_TYPE_SITEINFO:
      newNode = new NodeSiteInfo();
      break;
    case NODE_TYPE_STRIKE:
      newNode = new NodeStrike();
      break;
    case NODE_TYPE_ITALIC:
      newNode = new NodeItalic();
      break;
    default:
      throw new Error(`nodeFromJson: Parse Error: ¯\\_(ツ)_/¯ Unknown Node Type: ${data.type}`);
  }
  // recursively add child nodes, if present
  if (childNodes) {
    newNode.childNodes = childNodes.map(node => nodeFromJson(node))
  }
  return newNode;
}

export default function fromJson(data) {
  // recursively build up a React Component tree
  const {
    canonical,
    sections,
  } = data;
  return new BlogPost(
    canonical,
    sections.map(section => nodeFromJson(section)),
  );
}

// opinionated section nodes - can't have children
// these could be interesting in the editor 'add' menu but, they're currently supported with existing node types
// export const Gotcha = {} // facepalm emoji
// export const Tangent = {} // horse emoji
// export const Shrug = {} // shrug emoji

