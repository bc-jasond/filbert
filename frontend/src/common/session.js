import { AUTH_TOKEN_KEY, SESSION_KEY } from './constants';
import { apiPost } from './fetch';

export async function signin(username, password) {
  const { token, session } = await apiPost('/signin', { username, password });
  localStorage.setItem(AUTH_TOKEN_KEY, token);
  localStorage.setItem(SESSION_KEY, JSON.stringify(session));
  return { token, session };
}

export function getAuthToken() {
  return localStorage.getItem(AUTH_TOKEN_KEY);
}

export async function signout() {
  localStorage.removeItem(AUTH_TOKEN_KEY);
  localStorage.removeItem(SESSION_KEY);
}

export function getSession() {
  const session = localStorage.getItem(SESSION_KEY);
  return !session ? session : JSON.parse(session);
}

export function getUserName() {
  const session = getSession();
  return session ? session.username : null;
}