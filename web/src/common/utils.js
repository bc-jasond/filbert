import { isKeyed, Map, Record } from 'immutable';

import {
  HISTORY_MIN_NUM_CHARS,
  KEYCODE_SPACE,
  KEYCODE_SPACE_NBSP,
  SELECTION_ACTION_BOLD,
  SELECTION_ACTION_CODE,
  SELECTION_ACTION_ITALIC,
  SELECTION_ACTION_LINK,
  SELECTION_ACTION_MINI,
  SELECTION_ACTION_SITEINFO,
  SELECTION_ACTION_STRIKETHROUGH,
  SELECTION_LENGTH,
  SELECTION_LINK_URL,
  SELECTION_NEXT,
  ZERO_LENGTH_CHAR,
} from './constants';

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

export function s4() {
  return Math.floor((1 + Math.random()) * 0x10000)
    .toString(16)
    .substring(1);
}

export function getMapWithId(obj) {
  const { id } = obj;
  return Map({ ...obj, id: id || s4() });
}

// TODO: use KEYCODE_SPACE to fix word-wrap issue, not sure what's going on but sometimes formatted lines don't break on wordsolllllllllllllllllll;
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

export function moreThanNCharsAreDifferent(
  left,
  right,
  n = HISTORY_MIN_NUM_CHARS
) {
  let numDifferent = 0;
  if (typeof left !== 'string' || typeof right !== 'string') {
    return false;
  }
  if (Math.abs(left.length - right.length) > n) {
    return true;
  }
  let j = 0;
  let k = 0;
  for (let i = 0; i < Math.max(left.length, right.length); i++) {
    const leftChar = left.charAt(j);
    const rightChar = right.charAt(k);
    if (!leftChar) {
      numDifferent += 1;
      k += 1;
    } else if (!rightChar) {
      numDifferent += 1;
      j += 1;
    } else if (leftChar !== rightChar) {
      numDifferent += 1;
      if (left.length === right.length) {
        j += 1;
        k += 1;
      } else if (left.length > right.length) {
        j += 1;
      } else {
        k += 1;
      }
    } else {
      j += 1;
      k += 1;
    }
    if (numDifferent > n) {
      return true;
    }
  }
  return false;
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

export const Selection = Record({
  [SELECTION_NEXT]: undefined,
  [SELECTION_LENGTH]: -1,
  [SELECTION_ACTION_BOLD]: false,
  [SELECTION_ACTION_ITALIC]: false,
  [SELECTION_ACTION_CODE]: false,
  [SELECTION_ACTION_SITEINFO]: false,
  [SELECTION_ACTION_MINI]: false,
  [SELECTION_ACTION_STRIKETHROUGH]: false,
  [SELECTION_ACTION_LINK]: false,
  [SELECTION_LINK_URL]: '',
});

export function reviver(key, value) {
  if (value.has(SELECTION_NEXT) && value.has(SELECTION_LENGTH)) {
    return new Selection(value);
  }
  // ImmutableJS default behavior
  return isKeyed(value) ? value.toMap() : value.toList();
}

export function getFirstNode(nodesById) {
  const idSeen = new Set();
  const nextSeen = new Set();
  nodesById.forEach((node) => {
    idSeen.add(node.get('id'));
    if (node.get('next_sibling_id')) {
      nextSeen.add(node.get('next_sibling_id'));
    }
  });
  const difference = new Set([...idSeen].filter((id) => !nextSeen.has(id)));
  if (difference.size !== 1) {
    console.error(
      "DocumentError.getFirstNode() - more than one node isn't pointed to by another node!",
      difference
    );
  }
  const [firstId] = [...difference];
  return nodesById.get(firstId);
}

export function isBrowser() {
  return typeof window !== 'undefined';
}
