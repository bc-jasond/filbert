export const idRegExp = new RegExp(/[0-9a-f]{4}/);

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
