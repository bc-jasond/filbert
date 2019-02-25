export const BlogPost = {
  id: '', // int or hash
  canonical: '', // permalink, human readable
  title: '',
  sections: [],
  tags: [], // right?
}

export const BlogPostNode = {
  id: '', // might not need this for a 'save the whole document on every change' first version but, why not?
  type: '',
  childNodes: [],
  content: '',
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

// sections for layout - can only be children of the root node 'blogContent'
export const NODE_TYPE_SECTION_H1 = 'h1';
export const NODE_TYPE_SECTION_H2 = 'h2';
export const NODE_TYPE_SECTION_SPACER = 'spacer';
export const NODE_TYPE_SECTION_CONTENT = 'content';
// opinionated sections - have fixed format, can't have children
export const NODE_TYPE_SECTION_CODE = 'code';
export const NODE_TYPE_SECTION_IMAGE = 'image';
export const NODE_TYPE_SECTION_QUOTE = 'quote';
export const NODE_TYPE_SECTION_POSTLINK = 'postlink';

// nodes for content - must have a parent node of a section type
export const NODE_TYPE_TEXT = 'text';  // the #text or DOM nodeType 3
export const NODE_TYPE_P = 'p';
export const NODE_TYPE_PRE = 'pre';
export const NODE_TYPE_OL = 'ol';
export const NODE_TYPE_LI = 'li';
export const NODE_TYPE_A = 'a';
export const NODE_TYPE_LINK = 'link';
export const NODE_TYPE_CODE = 'code';
export const NODE_TYPE_SITEINFO = 'siteinfo';
export const NODE_TYPE_ITALIC = 'italic';
export const NODE_TYPE_STRIKE = 'strike';
