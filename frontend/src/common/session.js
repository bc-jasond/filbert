import { Map } from 'immutable';

import { AUTH_TOKEN_KEY, SESSION_KEY } from './constants';
import { get, set } from './local-storage';

export function signout() {
  set(AUTH_TOKEN_KEY, undefined, false);
  set(SESSION_KEY, undefined, false);
}

export function getSession() {
  return get(SESSION_KEY, Map());
}
