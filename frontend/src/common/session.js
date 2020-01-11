import { Map, fromJS } from 'immutable';

import { FILBERT_LOCALSTORAGE_KEY, AUTH_TOKEN_KEY, SESSION_KEY } from './constants';
import { apiPost } from './fetch';

function getLocalStorageContents() {
  let session;
  try {
    session = JSON.parse(localStorage.getItem(FILBERT_LOCALSTORAGE_KEY) || {})
    return fromJS(session);
  } catch (err) {
    return Map();
  }
}

export function get(key, defaultValue) {
  return getLocalStorageContents().get(key, defaultValue);
}

export function set(key, value) {
  localStorage.setItem(FILBERT_LOCALSTORAGE_KEY, JSON.stringify(getLocalStorageContents().set(key, value).toJS()))
}

export async function signin(username, password) {
  const { token, session } = await apiPost('/signin', { username, password });
  set(AUTH_TOKEN_KEY, token);
  set(SESSION_KEY, session);
  return { token, session };
}

export async function signinGoogle(googleUser, filbertUsername) {
  const { signupIsIncomplete, token, session } = await apiPost(
    '/signin-google',
    { googleUser, filbertUsername },
    true
  );
  if (signupIsIncomplete) {
    return { signupIsIncomplete };
  }
  set(AUTH_TOKEN_KEY, token);
  set(SESSION_KEY, session);
  return { signupIsIncomplete: false };
}

export function signout() {
  set(AUTH_TOKEN_KEY);
  set(SESSION_KEY);
}

export function getSession() {
  try {
    return get(SESSION_KEY, Map());
  } catch (err) {
    return Map()
  }
}
