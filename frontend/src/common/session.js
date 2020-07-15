import { Map } from 'immutable';

import {
  AUTH_TOKEN_KEY,
  LIGHT_MODE_THEME,
  MIXED_FONT_THEME,
  SESSION_FONT,
  SESSION_KEY,
  SESSION_THEME,
} from './constants';
import { get, set } from './local-storage';

export function getToken() {
  return get(AUTH_TOKEN_KEY, '');
}
export function getSession() {
  return get(SESSION_KEY, Map());
}
export function getTheme() {
  return get(SESSION_THEME, LIGHT_MODE_THEME);
}
export function getFont() {
  return get(SESSION_FONT, MIXED_FONT_THEME);
}

export function signin(token, session) {
  set(AUTH_TOKEN_KEY, token, false);
  set(SESSION_KEY, session, false);
}
export function signout() {
  set(AUTH_TOKEN_KEY, '', false);
  set(SESSION_KEY, '', false);
}
export function setTheme(theme) {
  set(SESSION_THEME, theme, false);
}
export function setFont(font) {
  set(SESSION_FONT, font, false);
}
