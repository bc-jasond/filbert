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

export function cleanText(text) {
  const re = new RegExp(ZERO_LENGTH_CHAR);
  const cleaned = text.trim().replace(re, '');
  return cleaned.length > 0 ? cleaned : ZERO_LENGTH_CHAR;
}

export function hasContent() {

}