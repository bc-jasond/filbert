import { Map } from 'immutable';
import { s4 } from '@filbert/util';

export function confirmPromise(msg) {
  return new Promise((resolve) => {
    if (confirm(msg)) {
      resolve(true);
      return;
    }
    resolve(false);
  });
}

export function formatPostDate(dateStr) {
  if (!dateStr) {
    return;
  }
  const publishedDate = new Date(dateStr);
  return publishedDate.toLocaleDateString('en-us', {
    // weekday: 'long',
    year: 'numeric',
    day: 'numeric',
    month: 'long',
  });
}

export function formatStreakDate(dateInt) {
  const date = new Date();
  date.setFullYear(parseInt(`${dateInt}`.substring(0, 4), 10));
  date.setMonth(parseInt(`${dateInt}`.substring(4, 6), 10));
  date.setDate(parseInt(`${dateInt}`.substring(6), 10));
  return date.toLocaleDateString('en-us', {
    // weekday: 'long',
    year: 'numeric',
    day: 'numeric',
    month: 'long',
  });
}

export function formatNumber(number) {
  return new Intl.NumberFormat().format(number);
}

export function getCharFromEvent(evt) {
  // Firefox issue when typing fast - skip these.  NOTE: this could ignore composing characters for languages other than English
  //https://stackoverflow.com/a/25509350/1991322
  if (evt.key === 'Process') {
    return '';
  }
  if (evt && typeof evt.keyCode !== 'undefined') {
    // for normal "found on the keyboard" characters
    return evt.key;
  }
  // for OS X emoji keyboard insert
  return evt.data;
}

export function getCanonicalFromTitle(title) {
  let canonical = title
    // take first 25 chars
    .substring(0, 25)
    .toLowerCase()
    // remove all whitespace, replace with hyphen
    .replace(/\s+/g, '-')
    // keep only alpha numeric chars
    .replace(/[^0-9a-z-]/g, '');
  // append a hash
  canonical += `-${s4()}`;
  // dedupe hyphens
  return canonical.replace(/-+/g, '-');
}

export function stopAndPrevent(evt) {
  if (evt && evt.stopPropagation && evt.preventDefault) {
    evt.stopPropagation();
    evt.preventDefault();
  }
}

export function usernameIsValid(maybeUsername) {
  return /^@[0-9a-z]{1,42}$/.test(maybeUsername);
}

export function idIsValid(maybeId) {
  return new RegExp(/[0-9a-f]{4}/).test(maybeId);
}

export function nodeIsValid(node) {
  return Map.isMap(node) && idIsValid(node.get('id'));
}

export function isBrowser() {
  return typeof window !== 'undefined';
}

export function getUrl(s) {
  try {
    const url = new URL(s);
    const urlString = url.toString();
    // URL().toString() adds the trailing / slash to the host portion of the url
    // this is annoying when you're typing
    // do a check to see if the end of the user input is a `/` and if not, strip it
    if (urlString.slice(-1) === '/' && s.slice(-1) !== '/') {
      return urlString.slice(0, -1);
    }
    return urlString;
  } catch (err) {
    return '';
  }
}
