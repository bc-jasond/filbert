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
  constructor(type, parent, childNodes = [], content = '', id = '') {
    this.type = type;
    this.parent = parent;
    this.childNodes = childNodes;
    this.content = content;
    this.id = id;
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
}

export class BlogPost extends BlogPostNode {
  constructor(canonical, id = '', tags = []) {
    super(NODE_TYPE_ROOT, null, [], '', id);
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
  constructor(parent, content) {
    super(NODE_TYPE_TEXT, parent, [], content);
  }
  
  render() {
    return this.content;
  }
}

export class NodeCode extends BlogPostNode {
  constructor(parent, content) {
    super(NODE_TYPE_CODE, parent, [], content);
  }
  
  render() {
    return (<Code>{this.content}</Code>)
  }
}

export class NodeSpacer extends BlogPostNode {
  constructor(parent) {
    super(NODE_TYPE_SECTION_SPACER, parent);
  }
  
  render() {
    return (<SpacerSection />)
  }
}

export class NodeH1 extends BlogPostNode {
  constructor(parent, childNodes) {
    super(NODE_TYPE_SECTION_H1, parent, childNodes);
  }
  
  render() {
    return (<H1>{this.childNodes.map(node => node.render())}</H1>)
  }
}

export class NodeH2 extends BlogPostNode {
  constructor(parent, childNodes) {
    super(NODE_TYPE_SECTION_H2, parent, childNodes);
  }
  
  render() {
    return (<H2>{this.childNodes.map(node => node.render())}</H2>)
  }
}

export class NodeContent extends BlogPostNode {
  constructor(parent, childNodes) {
    super(NODE_TYPE_SECTION_CONTENT, parent, childNodes);
  }
  
  render() {
    return (<ContentSection>{this.childNodes.map(node => node.render())}</ContentSection>)
  }
}

export class NodeCodeSection extends BlogPostNode {
  constructor(parent, lines) {
    super(NODE_TYPE_SECTION_CODE, parent);
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
  constructor(parent, width, height, url, caption) {
    super(NODE_TYPE_SECTION_IMAGE, parent);
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
  constructor(parent, quote, author, url, context) {
    super(NODE_TYPE_SECTION_QUOTE, parent);
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
  constructor(parent, to, content) {
    super(NODE_TYPE_SECTION_POSTLINK, parent);
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
  constructor(parent, childNodes) {
    super(NODE_TYPE_P, parent, childNodes);
  }
  
  render() {
    return (<P>{this.childNodes.map(node => node.render())}</P>)
  }
}

export class NodeOl extends BlogPostNode {
  constructor(parent, childNodes) {
    super(NODE_TYPE_OL, parent, childNodes);
  }
  
  render() {
    return (<Ol>{this.childNodes.map(node => node.render())}</Ol>)
  }
}

export class NodeLi extends BlogPostNode {
  constructor(parent, childNodes) {
    super(NODE_TYPE_LI, parent, childNodes);
  }
  
  render() {
    return (<Li>{this.childNodes.map(node => node.render())}</Li>)
  }
}

export class NodeLink extends BlogPostNode {
  constructor(parent, childNodes, content) {
    super(NODE_TYPE_LINK, parent, childNodes, content);
  }
  
  render() {
    return (<LinkStyled to={this.content}>{this.childNodes.map(node => node.render())}</LinkStyled>)
  }
}

export class NodeA extends BlogPostNode {
  constructor(parent, childNodes, content) {
    super(NODE_TYPE_A, parent, childNodes, content);
  }
  
  render() {
    return (<A href={this.content}>{this.childNodes.map(node => node.render())}</A>)
  }
}

export class NodeSiteInfo extends BlogPostNode {
  constructor(parent, childNodes) {
    super(NODE_TYPE_SITEINFO, parent, childNodes);
  }
  
  render() {
    return (<SiteInfo>{this.childNodes.map(node => node.render())}</SiteInfo>)
  }
}

export class NodeStrike extends BlogPostNode {
  constructor(parent, childNodes) {
    super(NODE_TYPE_STRIKE, parent, childNodes);
  }
  
  render() {
    return (<StrikeText>{this.childNodes.map(node => node.render())}</StrikeText>)
  }
}

export class NodeItalic extends BlogPostNode {
  constructor(parent, childNodes) {
    super(NODE_TYPE_ITALIC, parent, childNodes);
  }
  
  render() {
    return (<ItalicText>{this.childNodes.map(node => node.render())}</ItalicText>)
  }
}

export function getNode(data, parent) {
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
      return new NodeText(parent, content);
    case NODE_TYPE_CODE:
      return new NodeCode(parent, content);
    case NODE_TYPE_SECTION_H1:
      return new NodeH1(parent);
    case NODE_TYPE_SECTION_H2:
      return new NodeH2(parent);
    case NODE_TYPE_SECTION_SPACER:
      return new NodeSpacer(parent);
    case NODE_TYPE_SECTION_CONTENT:
      return new NodeContent(parent);
    case NODE_TYPE_SECTION_CODE:
      return new NodeCodeSection(parent, lines);
    case NODE_TYPE_SECTION_IMAGE:
      return new NodeImage(parent, width, height, url, caption);
    case NODE_TYPE_SECTION_QUOTE:
      return new NodeQuote(parent, quote, author, url, context);
    case NODE_TYPE_SECTION_POSTLINK:
      return new NodePostLink(parent, to, content);
    case NODE_TYPE_P:
      return new NodeP(parent);
    case NODE_TYPE_OL:
      return new NodeOl(parent);
    case NODE_TYPE_LI:
      return new NodeLi(parent);
    case NODE_TYPE_LINK:
      return new NodeLink(parent, [], content);
    case NODE_TYPE_A:
      return new NodeA(parent, [], content);
    case NODE_TYPE_SITEINFO:
      return new NodeSiteInfo(parent);
    case NODE_TYPE_STRIKE:
      return new NodeStrike(parent);
    case NODE_TYPE_ITALIC:
      return new NodeItalic(parent);
    default:
      throw new Error(`nodeFromJson: Parse Error: ¯\\_(ツ)_/¯ Unknown Node Type: ${data.type}`);
  }
}

export default function nodeFromJson(data, parent) {
  const { childNodes } = data;
  // create the new node from raw data
  const newNode = getNode(data, parent);
  // recursively create / add child nodes from raw data, if present
  if (childNodes) {
    newNode.childNodes = childNodes.map(node => nodeFromJson(node, newNode))
  }
  // return that guy
  return newNode;
}

// opinionated section nodes - can't have children
// these could be interesting in the editor 'add' menu but, they're currently supported with existing node types
// export const Gotcha = {} // facepalm emoji
// export const Tangent = {} // horse emoji
// export const Shrug = {} // shrug emoji

