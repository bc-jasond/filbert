/**
 * DON'T USE!! COPIED from parent directory.
 * I needed to use the *.mjs extension and remove 'native' JSX in order to use the node v11 experimental ESM support.
 * It worked, enough.
 * This is left here for reference and will probably soon become out of sync,
 * in the future for isometric or universal modules like this one (that could be used for server rendering)
 * I should support the *.mjs in webpack and look into a string representation for JSX or use babel in nodejs
 */
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
  }


}

export class NodeText extends BlogPostNode {
  constructor(content) {
    super(NODE_TYPE_TEXT, [], content);
  }


}

export class NodeCode extends BlogPostNode {
  constructor(content) {
    super(NODE_TYPE_CODE, [], content);
  }


}

export class NodeSpacer extends BlogPostNode {
  constructor() {
    super(NODE_TYPE_SECTION_SPACER);
  }


}

export class NodeH1 extends BlogPostNode {
  constructor(childNodes) {
    super(NODE_TYPE_SECTION_H1, childNodes);
  }


}

export class NodeH2 extends BlogPostNode {
  constructor(childNodes) {
    super(NODE_TYPE_SECTION_H2, childNodes);
  }


}

export class NodeContent extends BlogPostNode {
  constructor(childNodes) {
    super(NODE_TYPE_SECTION_CONTENT, childNodes);
  }


}

export class NodeCodeSection extends BlogPostNode {
  constructor(lines) {
    super(NODE_TYPE_SECTION_CODE);
    this.lines = lines;
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


}

export class NodeQuote extends BlogPostNode {
  constructor(quote, author, url, context) {
    super(NODE_TYPE_SECTION_QUOTE);
    this.quote = quote;
    this.author = author;
    this.url = url;
    this.context = context;
  }


}

export class NodePostLink extends BlogPostNode {
  constructor(to, content) {
    super(NODE_TYPE_SECTION_POSTLINK);
    this.to = to;
    this.content = content;
  }


}

export class NodeP extends BlogPostNode {
  constructor(childNodes) {
    super(NODE_TYPE_P, childNodes);
  }


}

export class NodeOl extends BlogPostNode {
  constructor(childNodes) {
    super(NODE_TYPE_OL, childNodes);
  }


}

export class NodeLi extends BlogPostNode {
  constructor(childNodes) {
    super(NODE_TYPE_LI, childNodes);
  }


}

export class NodeLink extends BlogPostNode {
  constructor(childNodes, content) {
    super(NODE_TYPE_LINK, childNodes, content);
  }


}

export class NodeA extends BlogPostNode {
  constructor(childNodes, content) {
    super(NODE_TYPE_A, childNodes, content);
  }


}

export class NodeSiteInfo extends BlogPostNode {
  constructor(childNodes) {
    super(NODE_TYPE_SITEINFO, childNodes);
  }


}

export class NodeStrike extends BlogPostNode {
  constructor(childNodes) {
    super(NODE_TYPE_STRIKE, childNodes);
  }


}

export class NodeItalic extends BlogPostNode {
  constructor(childNodes) {
    super(NODE_TYPE_ITALIC, childNodes);
  }


}

function getNode(data) {
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
  const newNode = getNode(data);
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

