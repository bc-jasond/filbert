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

export function initSessionCallbacks() {
  window.filbertAuthCallbacks = [];
}
export function registerAuthChangeCallback(fn) {
  if (!window.filbertAuthCallbacks) {
    initSessionCallbacks();
  }
  if (window.filbertAuthCallbacks.includes(fn)) {
    return;
  }
  window.filbertAuthCallbacks.push(fn);
}
export function deregisterAuthChangeCallback(fn) {
  if (!window.filbertAuthCallbacks) {
    return;
  }
  window.filbertAuthCallbacks = window.filbertAuthCallbacks.filter(
    (cb) => cb !== fn
  );
}
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

function fireAllCallbacks() {
  if (!window.filbertAuthCallbacks) {
    return;
  }
  window.filbertAuthCallbacks.forEach((cb) => {
    cb({ token: getToken(), session: getSession() });
  });
}
export function signin(token, session) {
  set(AUTH_TOKEN_KEY, token, false);
  set(SESSION_KEY, session, false);
  fireAllCallbacks();
}
export function signout() {
  set(AUTH_TOKEN_KEY, '', false);
  set(SESSION_KEY, '', false);
  fireAllCallbacks();
}
export function setTheme(theme) {
  set(SESSION_THEME, theme, false);
}
export function setFont(font) {
  set(SESSION_FONT, font, false);
}
