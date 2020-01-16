import { Map } from 'immutable';

import { AUTH_TOKEN_KEY, SESSION_KEY } from './constants';
import { apiPost } from './fetch';
import { get, set } from './local-storage';

export async function signin(username, password) {
  const { token, session } = await apiPost('/signin', { username, password });
  set(AUTH_TOKEN_KEY, token, false);
  set(SESSION_KEY, session, false);
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
  set(AUTH_TOKEN_KEY, token, false);
  set(SESSION_KEY, session, false);
  return { signupIsIncomplete: false };
}

export function signout() {
  set(AUTH_TOKEN_KEY, undefined, false);
  set(SESSION_KEY, undefined, false);
}

export function getSession() {
  try {
    return get(SESSION_KEY, Map());
  } catch (err) {
    return Map();
  }
}
