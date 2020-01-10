import {
  KEYCODE_SPACE,
  KEYCODE_SPACE_NBSP,
  ZERO_LENGTH_CHAR
} from './constants';

const { Map } = require('immutable');
const {
  confirmPromise,
  formatPostDate,
  s4,
  getMapWithId,
  cleanTextOrZeroLengthPlaceholder,
  cleanText,
  getCharFromEvent,
  getCanonicalFromTitle,
  imageUrlIsId,
  deleteContentRange
} = require('./utils');
const { idRegExp } = require('./test-helpers');

global.confirm = jest.fn().mockImplementation(arg => arg);

describe('utils', () => {
  test('confirmPromise', async () => {
    let caught = false;
    try {
      await confirmPromise(true);
      expect(caught).toBe(false);
      await confirmPromise(false);
    } catch (err) {
      caught = true;
    }
    expect(global.confirm).toHaveBeenCalledTimes(2);
    expect(caught).toBe(true);
  });
  test('formatPostDate', () => {
    expect(formatPostDate('2019-01-04 00:00:00')).toBe(
      'Friday, January 4, 2019'
    );
  });
  test('s4', () => {
    expect(idRegExp.test(s4())).toBe(true);
  });
  test('getMapWithId', () => {
    const objWithId = {
      id: '4455'
    };
    const map = getMapWithId(objWithId);
    expect(Map.isMap(map)).toBe(true);
    expect(map.get('id')).toBe('4455');
    const mapWithoutId = {
      foo: 'bar'
    };
    const map2 = getMapWithId(mapWithoutId);
    expect(Map.isMap(map2)).toBe(true);
    expect(idRegExp.test(map2.get('id'))).toBe(true);
    expect(map2.get('foo')).toBe('bar');
  });
  test('cleanTextOrZeroLengthPlaceholder', () => {
    const clean = "Hi, I'm clean";
    expect(cleanTextOrZeroLengthPlaceholder(clean)).toBe(clean);
    expect(cleanTextOrZeroLengthPlaceholder().charAt(0)).toBe(ZERO_LENGTH_CHAR);
  });
  test('cleanText', () => {
    const textWithPlaceholder = `${ZERO_LENGTH_CHAR}hey dawg`;
    const textWithPlaceholderClean = cleanText(textWithPlaceholder);
    expect(textWithPlaceholderClean).toBe('hey dawg');
    expect(textWithPlaceholderClean.length).toBe(
      textWithPlaceholder.length - 1
    );
    const spacesAllOverThePlace =
      '   And then     it happened, and it was great.   ';
    const spacesAllOverThePlaceClean = cleanText(spacesAllOverThePlace);
    expect(spacesAllOverThePlaceClean.charCodeAt(0)).toBe(KEYCODE_SPACE_NBSP);
    expect(
      spacesAllOverThePlaceClean.charCodeAt(
        spacesAllOverThePlaceClean.length - 1
      )
    ).toBe(KEYCODE_SPACE_NBSP);
    // test that spaces are "interleaved" with &nbsp; for proper display in HTML
    let hasConsequtiveSpaces = false;
    for (let i = 1; i < spacesAllOverThePlaceClean.length; i++) {
      const prev = spacesAllOverThePlaceClean.charCodeAt(i - 1);
      const current = spacesAllOverThePlaceClean.charCodeAt(i);
      if (current === KEYCODE_SPACE && prev === KEYCODE_SPACE) {
        hasConsequtiveSpaces = true;
      }
    }
    expect(hasConsequtiveSpaces).toBe(false);
  });
  test('getCharFromEvent', () => {
    const mockEventWithALetter = {
      keyCode: 0,
      key: 'W'
    };
    expect(getCharFromEvent(mockEventWithALetter)).toBe('W');
    const mockEventWithEmoji = {
      data: '👉'
    };
    expect(getCharFromEvent(mockEventWithEmoji)).toBe('👉');
  });
  test('getCanonicalFromTitle', () => {
    const canonical = getCanonicalFromTitle(
      'A SULTRY, stifling midday. Not a cloudlet in the sky. . . . The sun-baked grass had a disconsolate, hopeless look: even if there were rain it could never be green again. . . .'
    );
    // i.e. "a-sultry-stifling-midday-5940"
    const pieces = canonical.split('-');
    expect(pieces.length).toBe(5);
    expect(idRegExp.test(pieces[pieces.length - 1])).toBe(true);
  });
  test('imageUrlIsId', () => {
    expect(imageUrlIsId(100)).toBe(false);
    expect(
      imageUrlIsId(
        '313a8df039a32a3b708a982bed01c2bc7d6af316acf20a1e2a2aeef020a378e4'
      )
    ).toBe(true);
    expect(
      imageUrlIsId(
        'http://oops.some.duplicate.hash.on.another.site/313a8df039a32a3b708a982bed01c2bc7d6af316acf20a1e2a2aeef020a378e4'
      )
    ).toBe(false);
  });
  test('deleteContentRange', () => {
    const text = 'Someone must have been telling lies about Josef K.';
    // user presses "backspace"
    expect(deleteContentRange(text, 12, 0)).toBe(
      'Someone mus have been telling lies about Josef K.'
    );
    // no-op
    expect(deleteContentRange(text, 0, 0)).toBe(
      'Someone must have been telling lies about Josef K.'
    );
    // delete the whole string - can specify beyond end of string...
    expect(deleteContentRange(text, 0, 100)).toBe('');
  });
});
