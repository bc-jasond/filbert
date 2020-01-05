import { Map } from 'immutable';

import {
  KEYCODE_SPACE,
  KEYCODE_SPACE_NBSP,
  ZERO_LENGTH_CHAR
} from './constants';

export function confirmPromise(msg) {
  return new Promise((resolve, reject) => {
    if (confirm(msg)) {
      resolve();
      return;
    }
    reject();
  });
}

export function formatPostDate(dateStr) {
  const publishedDate = new Date(dateStr);
  return publishedDate.toLocaleDateString('en-us', {
    weekday: 'long',
    year: 'numeric',
    day: 'numeric',
    month: 'long'
  });
}

export function s4() {
  return Math.floor((1 + Math.random()) * 0x10000)
    .toString(16)
    .substring(1);
}

export function getMapWithId(obj) {
  const { id } = obj;
  return Map({ ...obj, id: id || s4() });
}

export function cleanText(text = '') {
  // ensure no more than 1 space in a row
  let final = '';
  let last = -1;
  for (let i = 0; i < text.length; i++) {
    const currentChar = text.charAt(i);
    const current = text.charCodeAt(i);
    // don't allow:
    // 1) a space at the beginning
    // 2) a space at the end
    // 3) more than 1 space in a row
    if (
      current === KEYCODE_SPACE &&
      (i === 0 || i === text.length - 1 || last === KEYCODE_SPACE)
    ) {
      const nbsp = String.fromCharCode(KEYCODE_SPACE_NBSP);
      final += nbsp;
      last = nbsp;
    } else if (currentChar !== ZERO_LENGTH_CHAR) {
      final += currentChar;
      last = current;
    }
  }
  return final;
}

export function cleanTextOrZeroLengthPlaceholder(text) {
  const cleaned = cleanText(text);
  return cleaned.length > 0 ? cleaned : ZERO_LENGTH_CHAR;
}

export function getCharFromEvent(evt) {
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

export function imageUrlIsId(url) {
  if (typeof url !== 'string') {
    return false;
  }
  // imageId is 64 character hex sha256 hash - assume all other input is a valid external url
  // this returns an array (truthy) of all string matches, in this case it should only have a length of 1
  const ids = url.match(/\b[0-9A-F]{64}\b/gi);
  return ids && ids.length === 1 && ids[0].length === url.length;
}

export function deleteContentRange(content, startIdx, length) {
  if (length === 0 && startIdx > 0) {
    // delete the char behind the caret - assumes "Backspace"
    // TODO: handle "Del"
    return `${content.slice(0, startIdx - 1)}${content.slice(startIdx)}`;
  }
  // delete all highlighted chars in front of the caret
  return `${content.slice(0, startIdx)}${content.slice(startIdx + length)}`;
}

export function stopAndPrevent(evt) {
  if (evt && evt.stopPropagation && evt.preventDefault) {
    evt.stopPropagation();
    evt.preventDefault();
  }
}
