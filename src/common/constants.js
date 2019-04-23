export const NODE_TYPE_ROOT = 'root';
// sections for layout - can only be children of the root node 'blogContent'
export const NODE_TYPE_SECTION_H1 = 'h1';
export const NODE_TYPE_SECTION_H2 = 'h2';
export const NODE_TYPE_SECTION_SPACER = 'spacer';
export const NODE_TYPE_SECTION_CONTENT = 'content';
// opinionated sections - have fixed format, can't have children
export const NODE_TYPE_SECTION_CODE = 'codesection';
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

// EDITOR
export const NEW_POST_ID = 'dubaniewicz-new-post';