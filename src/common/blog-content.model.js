import React from 'react';
import {
  NODE_TYPE_SECTION_H1,
  NODE_TYPE_SECTION_H2,
  NODE_TYPE_SECTION_SPACER,
  NODE_TYPE_TEXT } from './constants';
import {
  H1,
  H2,
  SpacerSection,
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
  } = data;
  // create the new node
  let newNode;
  switch (type) {
    case NODE_TYPE_TEXT:
      newNode = new NodeText(content);
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
    default:
      throw new Error(`Unknown Node Type: ${data.type}`);
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
export const Code = {
  id: '',
  type: '',
  lines: [], // array of strings only - one level of <Pre> tags
}

export const Image = {
  id: '',
  type: '',
  width: 0,
  height: 0,
  url: '',
  caption: '',
}

export const Quote = {
  id: '',
  type: '',
  quote: '',
  author: '',
  source: '',
  link: '',
}

export const PostLink = {
  to: '',
  content: '',
}

// these could be interesting in the editor 'add' menu but, they're currently supported with existing node types
// export const Gotcha = {} // facepalm emoji
// export const Tangent = {} // horse emoji
// export const Shrug = {} // shrug emoji

