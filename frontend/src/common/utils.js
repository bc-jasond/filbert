import { Map } from 'immutable';

import { ZERO_LENGTH_CHAR } from './constants';

export function confirmPromise(msg) {
  return new Promise((resolve, reject) => {
    confirm(msg) ? resolve() : reject();
  })
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
  obj.id = obj.id || s4();
  return Map(obj);
}

export function cleanTextOrZeroLengthPlaceholder(text) {
  const cleaned = cleanText(text);
  return cleaned.length > 0 ? cleaned : ZERO_LENGTH_CHAR;
}

export function cleanText(text) {
  const re = new RegExp(ZERO_LENGTH_CHAR);
  return text
    .replace(re, '')
}

export function getCharFromEvent(evt, node, offset) {
  if (evt && typeof evt.keyCode !== undefined) {
    // TODO: replace only necessary spaces with &nbsp;
    if (evt.keyCode === 32) {
      return String.fromCharCode(160);
    }
    return evt.key;
  } else {
    // TODO: handle emoji keyboard insert
    return evt.nativeEvent.data;
  }
}

function normalizeHtmlEntities(text) {
  // TODO: what other htmlentities need to be normalized here?
  // for pesky char code 160 ( &nbsp; )
  // contenteditable automatically converts between " " 32 and "&nbsp;" 160 for placeholder spaces at the end of tags or sequential spaces
  // we want to normalize this (to 32) for diffing
  return text.replace(String.fromCharCode(160), String.fromCharCode(32));
}

export function getDiffStartAndLength(oldStr, newStr) {
  const diffLength = Math.abs(oldStr.length - newStr.length);
  const doesAddCharacters = newStr.length > oldStr.length;
  const loopLength = Math.max(newStr.length, oldStr.length);
  
  for (let i = 0; i < loopLength; i++) {
    let oldCurrent = normalizeHtmlEntities(oldStr).charAt(i);
    let newCurrent = normalizeHtmlEntities(newStr).charAt(i);
    if (oldCurrent.length === 0) {
      // chars were added to the end
      return [i, diffLength];
    }
    if (newCurrent.length === 0) {
      // chars were deleted from the end
      // offset the loop counter to account for the change in direction (right to left for a 'delete')
      return [i, -diffLength];
    }
    if (oldCurrent !== newCurrent) {
      return [i, doesAddCharacters ? diffLength : -diffLength];
    }
  }
  // strings are the same!
  return [-1, 0];
}

export function getCanonicalFromTitle(title) {
  let canonical = title
    // take first 25 chars
    .substring(0, 25)
    .toLowerCase()
    // remove all whitespace, replace with hyphen
    .replace(/\s+/g, "-")
    // keep only alpha numeric chars
    .replace(/[^0-9a-z-]/g, "");
  // append a hash
  canonical += '-' + s4();
  // dedupe hyphens
  return canonical.replace(/-+/g, "-");
}

export function imageUrlIsId(url) {
  if (typeof url !== 'string') {
    return;
  }
  // imageId is 64 character hex sha256 hash - assume all other input is a valid external url
  // this returns an array (truthy) of all string matches, in this case it should only be 1
  const ids = url.match(/\b[0-9A-F]{64}\b/gi);
  return ids && ids.length === 1;
}