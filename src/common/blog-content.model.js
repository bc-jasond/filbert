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
  constructor(type, childNodes = [], content = '', id = '') {
    this.type = type;
    this.childNodes = childNodes;
    this.content = content;
    this.id = id;
  }

  toJson() {
    const raw = {...this};
    raw.childNodes = raw.childNodes.map(child => child.toJson());
    return raw;
  }
}

export class BlogPost extends BlogPostNode {
  constructor(canonical, id = '', tags = []) {
    super(NODE_TYPE_ROOT, [], '', id);
    this.canonical = canonical; // permalink, human readable
    this.tags = tags; // for later?
    this.publishedDate;
    this.author;
    this.tenant;
  }

  render() {
    return (
      <React.Fragment>
        {this.childNodes.map(node => node.render())}
      </React.Fragment>
    );
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

export function getNodeFromJson(data) {
  const {
    id,
    type,
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
    // for root
    canonical,
    tags,
  } = data;
  switch (type) {
    case NODE_TYPE_ROOT:
      return new BlogPost(canonical, [], id, tags);
    case NODE_TYPE_TEXT:
      return new NodeText(content);
    case NODE_TYPE_CODE:
      return new NodeCode(content);
    case NODE_TYPE_SECTION_H1:
      return new NodeH1();
    case NODE_TYPE_SECTION_H2:
      return new NodeH2();
    case NODE_TYPE_SECTION_SPACER:
      return new NodeSpacer();
    case NODE_TYPE_SECTION_CONTENT:
      return new NodeContent();
    case NODE_TYPE_SECTION_CODE:
      return new NodeCodeSection(lines);
    case NODE_TYPE_SECTION_IMAGE:
      return new NodeImage(width, height, url, caption);
    case NODE_TYPE_SECTION_QUOTE:
      return new NodeQuote(quote, author, url, context);
    case NODE_TYPE_SECTION_POSTLINK:
      return new NodePostLink(to, content);
    case NODE_TYPE_P:
      return new NodeP();
    case NODE_TYPE_OL:
      return new NodeOl();
    case NODE_TYPE_LI:
      return new NodeLi();
    case NODE_TYPE_LINK:
      return new NodeLink([], content);
    case NODE_TYPE_A:
      return new NodeA([], content);
    case NODE_TYPE_SITEINFO:
      return new NodeSiteInfo();
    case NODE_TYPE_STRIKE:
      return new NodeStrike();
    case NODE_TYPE_ITALIC:
      return new NodeItalic();
    default:
      throw new Error(`nodeFromJson: Parse Error: ¯\\_(ツ)_/¯ Unknown Node Type: ${data.type}`);
  }
}

export default function nodeFromJson(data) {
  const { childNodes } = data;
  // create the new node from raw data
  const newNode = getNodeFromJson(data);
  // recursively create / add child nodes from raw data, if present
  if (childNodes) {
    newNode.childNodes = childNodes.map(node => nodeFromJson(node))
  }
  // return that guy
  return newNode;
}

// opinionated section nodes - can't have children
// these could be interesting in the editor 'add' menu but, they're currently supported with existing node types
// export const Gotcha = {} // facepalm emoji
// export const Tangent = {} // horse emoji
// export const Shrug = {} // shrug emoji

