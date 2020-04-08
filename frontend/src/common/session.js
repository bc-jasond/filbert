import { Map } from 'immutable';

import {
  AUTH_TOKEN_KEY,
  LIGHT_MODE_THEME,
  SESSION_KEY,
  SESSION_THEME,
} from './constants';
import { get, set } from './local-storage';

export function signout() {
  set(AUTH_TOKEN_KEY, '', false);
  set(SESSION_KEY, '', false);
}

export function getSession() {
  return get(SESSION_KEY, Map());
}

export function getTheme() {
  return get(SESSION_THEME, LIGHT_MODE_THEME);
}

export function setTheme(theme) {
  set(SESSION_THEME, theme, false);
}
