export const idRegExp = new RegExp(/[0-9a-f]{4}/);

export function overrideConsole() {
  global.console = {
    info: jest.fn(),
    warn: jest.fn(),
    error: jest.fn()
  };
}
