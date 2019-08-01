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
export const NODE_TYPE_OL = 'ol';

// base nodes for content - must have a parent node of a section type
export const NODE_TYPE_P = 'p';
export const NODE_TYPE_PRE = 'pre';
export const NODE_TYPE_LI = 'li';

// formatting nodes
export const NODE_TYPE_A = 'a';
export const NODE_TYPE_CODE = 'code';
export const NODE_TYPE_SITEINFO = 'siteinfo';
export const NODE_TYPE_ITALIC = 'italic';
export const NODE_TYPE_STRIKE = 'strike';
export const NODE_TYPE_BOLD = 'bold';
// @deprecated, should just be a type of NODE_TYPE_A
export const NODE_TYPE_LINK = 'link';


// EDITOR
// TODO: this is a placeholder to be able to set the caret in an empty tag
export const NEW_POST_URL_ID = 'new';
export const ROOT_NODE_PARENT_ID = 'null';
export const ZERO_LENGTH_CHAR = '\u200B';
// key codes
export const BACKSPACE_KEY = 8;
export const ENTER_KEY = 13;
export const ESC_KEY = 27;
export const LEFT_ARROW = 37;
export const UP_ARROW = 38;
export const RIGHT_ARROW = 39;
export const DOWN_ARROW = 40;
// edit actions
export const NODE_ACTION_INSERT = 'insert';
export const NODE_ACTION_UPDATE = 'update';
export const NODE_ACTION_DELETE = 'delete';
// selection actions
export const SELECTION_ACTION_BOLD = 'selection-bold';
export const SELECTION_ACTION_ITALIC = 'selection-italic';
export const SELECTION_ACTION_CODE = 'selection-code';
export const SELECTION_ACTION_STRIKETHROUGH = 'selection-strikethrough';
export const SELECTION_ACTION_LINK = 'selection-link';
export const SELECTION_ACTION_H1 = 'selection-h1';
export const SELECTION_ACTION_H2 = 'selection-h2';

// ENV
export const API_URL = process.env.API_URL;

// AUTH
export const AUTH_TOKEN_KEY = 'dubaniewicz-token';
export const SESSION_KEY = 'dubaniewicz-session';

// DOM
export const DOM_TEXT_NODE_TYPE_ID = 3;