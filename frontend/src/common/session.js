import { AUTH_TOKEN_KEY, SESSION_KEY } from './constants';
import { apiPost } from './fetch';

export async function signin(username, password) {
  const { token, session } = await apiPost('/signin', { username, password });
  localStorage.setItem(AUTH_TOKEN_KEY, token);
  localStorage.setItem(SESSION_KEY, JSON.stringify(session));
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
  localStorage.setItem(AUTH_TOKEN_KEY, token);
  localStorage.setItem(SESSION_KEY, JSON.stringify(session));
  return { signupIsIncomplete: false };
}

export async function signout() {
  localStorage.removeItem(AUTH_TOKEN_KEY);
  localStorage.removeItem(SESSION_KEY);
}

export function getSession() {
  try {
    const session = localStorage.getItem(SESSION_KEY);
    return !session ? session : JSON.parse(session);
  } catch (err) {
    signout();
  }
  return null;
}

export function getUserName() {
  const session = getSession();
  return session ? session.username : null;
}
