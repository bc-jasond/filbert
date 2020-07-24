const { fromJS } = require('immutable');
const { reviver } = require('./utils');
const { SELECTION_LENGTH, SELECTION_NEXT } = require('./constants');

function overrideConsole() {
  global.console = {
    debug: jest.fn(),
    info: jest.fn(),
    warn: jest.fn(),
    error: jest.fn(),
    log: jest.fn(),
  };
}

function mockLocalStorage() {
  global.localStorageStorage = {};
  global.localStorage = {
    getItem: (k) => global.localStorageStorage[k],
    setItem: (k, v) => (global.localStorageStorage[k] = v),
    clear: () => (global.localStorageStorage = {}),
  };
}

function makeSelections(values) {
  const head = {};
  let current = head;
  let prev;
  do {
    let [currentLength, ...currentValues] = values.shift();
    current[SELECTION_LENGTH] = currentLength;
    currentValues.forEach((v) => {
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

function makeHistoryLogEntries(values) {
  return values.map(
    ([
      historyStateArg = [[]],
      executeNode = 'foo',
      executeStart = 0,
      unexecuteNode = 'foo',
      unexecuteStart = 0,
    ]) => {
      return {
        executeSelectionOffsets: {
          startNodeId: executeNode,
          caretStart: executeStart,
        },
        unexecuteSelectionOffsets: {
          startNodeId: unexecuteNode,
          caretStart: unexecuteStart,
        },
        historyState: historyStateArg.map(([executeState, unexecuteState]) => ({
          executeState,
          unexecuteState,
        })),
      };
    }
  );
}

module.exports = {
  overrideConsole,
  mockLocalStorage,
  makeSelections,
  makeHistoryLogEntries,
}
