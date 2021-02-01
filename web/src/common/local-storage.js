import { fromJS, isImmutable, Map } from 'immutable';
import { FILBERT_LOCALSTORAGE_NAMESPACE } from './constants';

// reading & parsing JSON from localStorage is too slow.
// take a dual-write approach - one sync to memory and one optimistic async to localStorage
let inMemoryCache = Map();
let writeTimeout = {};

// TODO: this is a cheap way out, this file should be mocked in consumer tests
export function clearForTests() {
  inMemoryCache = Map();
  writeTimeout = {};
}

function getNamespacedKey(key) {
  return `${FILBERT_LOCALSTORAGE_NAMESPACE}-${key}`;
}

export function set(key, value, debounce = true) {
  if (!value) {
    inMemoryCache = inMemoryCache.delete(key);
  } else {
    inMemoryCache = inMemoryCache.set(key, fromJS(value));
  }

  if (writeTimeout[key]) {
    clearTimeout(writeTimeout[key]);
  }
  const setLocalStorage = (k) => {
    try {
      const namespacedKey = getNamespacedKey(k);
      let item = inMemoryCache.get(k);
      if (isImmutable(item)) {
        item = item.toJS();
      }
      if (!item) {
        localStorage.removeItem(namespacedKey);
      } else {
        localStorage.setItem(namespacedKey, JSON.stringify(item));
      }
    } catch (err) {
      // sometimes the localStorage.setItem() call fails - probably exceeded quota
      console.error(err);
      if (err?.name === 'QuotaExceededError') {
        // truncate history
      }
    }
  };
  if (!debounce) {
    setLocalStorage(key);
    return;
  }
  // this is a "backup" of the in memory storage to localStorage (for page reload in the same browser)
  // TODO: this could be written to a central storage like the DB or redis
  // this is a slow operation, only do it every so often
  writeTimeout[key] = setTimeout(setLocalStorage.bind(null, key), 3000);
}

export function get(key, defaultValue) {
  const namespacedKey = getNamespacedKey(key);
  try {
    if (!inMemoryCache.has(key)) {
      const currentLocal = localStorage.getItem(namespacedKey);
      if (
        currentLocal &&
        currentLocal !== 'undefined' &&
        currentLocal !== 'null'
      ) {
        const jsValue = JSON.parse(currentLocal);
        const woke = fromJS(jsValue);
        inMemoryCache = inMemoryCache.set(key, woke);
      }
    }
  } catch (err) {
    console.error(err);
    // if JSON.parse() fails, just blow this key away!
    set(key, undefined, false);
  }
  return inMemoryCache.get(key) || defaultValue;
}
