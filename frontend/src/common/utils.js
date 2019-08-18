import { Map } from 'immutable';

import { ZERO_LENGTH_CHAR } from './constants';

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
    // for pesky char code 160 ( &nbsp; )
    // Update: leave it in.
    // contenteditable automatically converts between 32 and 160 for placeholder spaces at the end of tags
    //.replace(/\s+/g, " ");
}

export function getDiffStartAndLength(oldStr, newStr) {
  const diffLength = Math.abs(oldStr.length - newStr.length);
  const doesAddCharacters = newStr.length > oldStr.length;
  const loopLength = Math.max(newStr.length, oldStr.length);
  
  for (let i = 0; i < loopLength; i++) {
    let oldCurrent = oldStr.charAt(i);
    let newCurrent = newStr.charAt(i);
    if (!oldCurrent) {
      // chars were added to the end
      return [i, diffLength];
    }
    if (!newCurrent) {
      // chars were deleted from the end
      return [i, -diffLength];
    }
    if (oldCurrent !== newCurrent) {
      return [i, doesAddCharacters ? diffLength : -diffLength];
    }
  }
  // strings are the same!
  return [-1, 0];
}