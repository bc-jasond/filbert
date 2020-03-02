import { fromJS } from 'immutable';
import { reviver } from './utils';
import { SELECTION_LENGTH, SELECTION_NEXT } from './constants';

export function overrideConsole() {
  global.console = {
    info: jest.fn(),
    warn: jest.fn(),
    error: jest.fn()
  };
}

export function mockLocalStorage() {
  global.localStorageStorage = {};
  global.localStorage = {
    getItem: k => global.localStorageStorage[k],
    setItem: (k, v) => (global.localStorageStorage[k] = v),
    clear: () => (global.localStorageStorage = {})
  };
}

export function mockSetTimeout() {
  global.setTimeout = jest.fn();
}

export function makeSelections(values) {
  const head = {};
  let current = head;
  let prev;
  do {
    let [currentLength, ...currentValues] = values.shift();
    current[SELECTION_LENGTH] = currentLength;
    currentValues.forEach(v => {
      if (typeof v === 'object') {
        current[v.key] = v.value;
      } else {
        current[v] = true;
      }
    });
    if (prev) {
      prev[SELECTION_NEXT] = current;
    }
    prev = current;
    current = {};
  } while (values.length);
  prev[SELECTION_NEXT] = undefined; //important for the reviver()
  prev[SELECTION_LENGTH] = -1;
  return fromJS(head, reviver);
}
