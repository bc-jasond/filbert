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
} = require("./utils");

global.confirm = jest.fn().mockImplementation(arg => arg);
const idRegExp = new RegExp(/[0-9a-f]{4}/);

describe("utils", () => {
  test("confirmPromise", async () => {
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
  test("formatPostDate", () => {
    expect(formatPostDate("2019-01-04 00:00:00")).toMatchInlineSnapshot(
      `"Friday, January 4, 2019"`
    );
  });
  test("s4", () => {
    expect(idRegExp.test(s4())).toBe(true);
  });
  test("getMapWithId", () => {
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
  test.todo("cleanTextOrZeroLengthPlaceholder");
  test.todo("cleanText");
  test("getCharFromEvent", () => {
    const mockEventWithALetter = {
      keyCode: 0,
      key: "W"
    };
    expect(getCharFromEvent(mockEventWithALetter)).toBe("W");
    const mockEventWithEmoji = {
      nativeEvent: {
        data: '👉'
      }
    }
    expect(getCharFromEvent(mockEventWithEmoji)).toBe('👉')
  });
  test("getCanonicalFromTitle", () => {
    const canonical = getCanonicalFromTitle(
      "A SULTRY, stifling midday. Not a cloudlet in the sky. . . . The sun-baked grass had a disconsolate, hopeless look: even if there were rain it could never be green again. . . ."
    );
    // i.e. "a-sultry-stifling-midday-5940"
    const pieces = canonical.split('-');
    expect(pieces.length).toBe(5);
    expect(idRegExp.test(pieces[pieces.length - 1])).toBe(true);
  });
  test("imageUrlIsId", () => {
    expect(
      imageUrlIsId(
        "313a8df039a32a3b708a982bed01c2bc7d6af316acf20a1e2a2aeef020a378e4"
      )
    ).toBe(true);
    expect(
      imageUrlIsId(
        "http://oops.some.duplicate.hash.on.another.site/313a8df039a32a3b708a982bed01c2bc7d6af316acf20a1e2a2aeef020a378e4"
      )
    ).toBe(false);
  });
  test("deleteContentRange", () => {
    const text = "Someone must have been telling lies about Josef K.";
    // user presses "backspace"
    expect(deleteContentRange(text, 12, 0)).toMatchInlineSnapshot(
      `"Someone mus have been telling lies about Josef K."`
    );
    // no-op
    expect(deleteContentRange(text, 0, 0)).toMatchInlineSnapshot(
      `"Someone must have been telling lies about Josef K."`
    );
    // delete the whole string - can specify beyond end of string...
    expect(deleteContentRange(text, 0, 100)).toMatchInlineSnapshot(`""`);
  });
});
