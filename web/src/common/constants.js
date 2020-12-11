export const PAGE_NAME_VIEW = 'public';
export const PAGE_NAME_EDIT = 'edit';
export const PAGE_NAME_PUBLIC = 'public';
export const PAGE_NAME_PRIVATE = 'private';
export const PAGE_NAME_MANAGE = 'manage';
export const PAGE_NAME_USER_PROFILE = 'user';

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


// THEME
export const DARK_MODE_THEME = 'dark';
export const LIGHT_MODE_THEME = 'light';
export const SANS_FONT_THEME = 'sans';
export const MIXED_FONT_THEME = 'mixed';
