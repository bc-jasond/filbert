import { fromJS, Map } from 'immutable';
import { reviver } from '../pages/edit/document-model';
import { FILBERT_LOCALSTORAGE_KEY } from './constants';

function getLocalStorageContents() {
  let session;
  try {
    session = JSON.parse(localStorage.getItem(FILBERT_LOCALSTORAGE_KEY) || {});
    return fromJS(session, reviver);
  } catch (err) {
    return Map();
  }
}

export function get(key, defaultValue) {
  return getLocalStorageContents().get(key, defaultValue);
}

export function set(key, value) {
  localStorage.setItem(
    FILBERT_LOCALSTORAGE_KEY,
    JSON.stringify(
      getLocalStorageContents()
        .set(key, value)
        .toJS()
    )
  );
}
