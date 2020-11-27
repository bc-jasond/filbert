export const PAGE_NAME_VIEW = 'public';
export const PAGE_NAME_EDIT = 'edit';
export const PAGE_NAME_PUBLIC = 'public';
export const PAGE_NAME_PRIVATE = 'private';
export const PAGE_NAME_MANAGE = 'manage';
export const PAGE_NAME_USER_PROFILE = 'user';

// EDITOR
export const NEW_POST_URL_ID = 'new';
// TODO: this is a placeholder to be able to set the caret in an empty tag
export const ZERO_LENGTH_CHAR = '\u200B';
// key codes from a 2015 macbook 13" & Kinesis Advantage2
// TODO: keyCode is deprecated
export const KEYCODE_BACKSPACE = 8;
export const KEYCODE_TAB = 9;
export const KEYCODE_ENTER = 13;
export const KEYCODE_SHIFT_RIGHT = 16;
export const KEYCODE_CTRL = 17;
export const KEYCODE_ALT = 18;
export const KEYCODE_CAPS_LOCK = 20;
export const KEYCODE_ESC = 27;
export const KEYCODE_SPACE = 32;
export const KEYCODE_PAGE_UP = 33;
export const KEYCODE_PAGE_DOWN = 34;
export const KEYCODE_END = 35;
export const KEYCODE_HOME = 36;
export const KEYCODE_LEFT_ARROW = 37;
export const KEYCODE_UP_ARROW = 38;
export const KEYCODE_RIGHT_ARROW = 39;
export const KEYCODE_DOWN_ARROW = 40;
export const KEYCODE_DEL = 46;
export const KEYCODE_V = 86;
export const KEYCODE_X = 88;
export const KEYCODE_Z = 90;
export const KEYCODE_Y = 89;
export const KEYCODE_SHIFT_OR_COMMAND_LEFT = 91;
export const KEYCODE_COMMAND_RIGHT = 93;
export const KEYCODE_F1 = 112;
export const KEYCODE_F2 = 113;
export const KEYCODE_F3 = 114;
export const KEYCODE_F4 = 115;
export const KEYCODE_F5 = 116;
export const KEYCODE_F6 = 117;
export const KEYCODE_F7 = 118;
export const KEYCODE_F8 = 119;
export const KEYCODE_F9 = 120;
export const KEYCODE_F10 = 121;
export const KEYCODE_F11 = 122;
export const KEYCODE_F12 = 123;
export const KEYCODE_PRINT_SCREEN = 124;
export const KEYCODE_SPACE_NBSP = 160;

// post level edits
export const POST_ACTION_REDIRECT_TIMEOUT = 1000;

// ENV
export const API_URL =
  process.env.NODE_ENV === 'production'
    ? 'https://api.filbert.xyz'
    : 'http://localhost:3001';

// AUTH
export const FILBERT_LOCALSTORAGE_NAMESPACE = 'filbert';
export const AUTH_TOKEN_KEY = 'token';
export const SESSION_KEY = 'session';
export const SESSION_THEME = 'theme';
export const SESSION_FONT = 'font';

// DOM
export const DOM_ELEMENT_NODE_TYPE_ID = 1;
export const DOM_TEXT_NODE_TYPE_ID = 3;
export const DOM_INPUT_TAG_NAME = 'INPUT';


// THEME
export const DARK_MODE_THEME = 'dark';
export const LIGHT_MODE_THEME = 'light';
export const SANS_FONT_THEME = 'sans';
export const MIXED_FONT_THEME = 'mixed';
