import immutable from 'immutable';
import {
  SELECTION_ACTION_BOLD,
  SELECTION_ACTION_CODE,
  SELECTION_ACTION_ITALIC,
  SELECTION_ACTION_LINK,
  SELECTION_ACTION_MINI,
  SELECTION_ACTION_SITEINFO,
  SELECTION_LINK_URL,
  adjustSelectionOffsetsAndCleanup,
  getSelectionByContentOffset,
  splitSelectionsAtCaretOffset,
  concatSelections,
  setSiteinfo,
  replaceSelection,
  setItalic,
  setCode,
  setMini,
  getContentBySelections,
} from './selection-helpers.mjs';
import { fromTestArray, toArrayWithoutIds } from '@filbert/test';
import { cleanTextOrZeroLengthPlaceholder, s4 } from '@filbert/util';
import {
  getAt,
  indexOf,
  LINKED_LIST_NODE_ID,
  linkedListFromJS,
} from '@filbert/linked-list';

const { Map } = immutable;

const testContent = 'And a second paragraph because';
let testFormatSelections;

beforeAll(() => {
  console.debug = () => {};
  console.info = () => {};
  console.log = () => {};
});

beforeEach(() => {
  testFormatSelections = fromTestArray([
    [3, SELECTION_ACTION_SITEINFO],
    [3],
    [6, SELECTION_ACTION_ITALIC],
    [1],
    [9, SELECTION_ACTION_CODE],
    [],
  ]);
});

describe('adjustSelectionOffsetsAndCleanup', () => {
  test('delete all highlighted characters up to caret (when "end" in handleBackspace)', () => {
    const expectedSelections = fromTestArray([[5, SELECTION_ACTION_CODE], []]);
    const testContentAdjusted = testContent.substring(17);
    const formatSelectionsAdjusted = adjustSelectionOffsetsAndCleanup(
      testFormatSelections,
      testContentAdjusted.length,
      testContent.length,
      17,
      -17
    );
    expect(toArrayWithoutIds(formatSelectionsAdjusted)).toEqual(
      toArrayWithoutIds(expectedSelections)
    );
  });
  test('delete all highlighted characters up to caret (up to edge of a selection)', () => {
    const prevContent = 'and some paragraph for good measure?';
    const expectedSelections = fromTestArray([
      [9],
      [9, SELECTION_ACTION_CODE],
      [],
    ]);
    const testContentAdjusted = 'and some paragraph for  measure?';
    const testFormatSelections = fromTestArray([
      [9],
      [9, SELECTION_ACTION_CODE],
      [5],
      [4, SELECTION_ACTION_BOLD, SELECTION_ACTION_ITALIC],
      [],
    ]);
    const formatSelectionsAdjusted = adjustSelectionOffsetsAndCleanup(
      testFormatSelections,
      testContentAdjusted.length,
      prevContent.length,
      27,
      -4
    );
    expect(toArrayWithoutIds(formatSelectionsAdjusted)).toEqual(
      toArrayWithoutIds(expectedSelections)
    );
  });
  test('delete all highlighted characters from caret through the end (when "start" with multiple nodes in handleBackspace)', () => {
    const expectedSelections = fromTestArray([
      [3, SELECTION_ACTION_SITEINFO],
      [3],
      [6, SELECTION_ACTION_ITALIC],
      [1],
      [, SELECTION_ACTION_CODE],
    ]);
    const testContentAdjusted = testContent.substring(0, 17);
    const formatSelectionsAdjusted = adjustSelectionOffsetsAndCleanup(
      testFormatSelections,
      testContentAdjusted.length,
      testContent.length,
      30,
      -13
    );
    expect(toArrayWithoutIds(formatSelectionsAdjusted)).toEqual(
      toArrayWithoutIds(expectedSelections)
    );
  });
  test('delete highlighted characters from middle, deletes a selection, adjusts overlapping selections', () => {
    const expectedSelections = fromTestArray([
      [3, SELECTION_ACTION_SITEINFO],
      [1],
      [5, SELECTION_ACTION_CODE],
      [],
    ]);
    const testContentAdjusted = `${testContent.substring(
      0,
      4
    )}${testContent.substring(17)}`;
    const formatSelectionsAdjusted = adjustSelectionOffsetsAndCleanup(
      testFormatSelections,
      testContentAdjusted.length,
      testContent.length,
      17,
      -13
    );
    expect(toArrayWithoutIds(formatSelectionsAdjusted)).toEqual(
      toArrayWithoutIds(expectedSelections)
    );
  });
  test('delete highlighted characters from one whole selection evenly', () => {
    const expectedSelections = fromTestArray([
      [3, SELECTION_ACTION_SITEINFO],
      [4],
      [9, SELECTION_ACTION_CODE],
      [],
    ]);
    const testContentAdjusted = `${testContent.substring(
      0,
      6
    )}${testContent.substring(12)}`;
    const formatSelectionsAdjusted = adjustSelectionOffsetsAndCleanup(
      testFormatSelections,
      testContentAdjusted.length,
      testContent.length,
      12,
      -6
    );
    expect(toArrayWithoutIds(formatSelectionsAdjusted)).toEqual(
      toArrayWithoutIds(expectedSelections)
    );
  });
  test('delete highlighted characters from middle of one selection', () => {
    const expectedSelections = fromTestArray([
      [3, SELECTION_ACTION_SITEINFO],
      [3],
      [3, SELECTION_ACTION_ITALIC],
      [1],
      [9, SELECTION_ACTION_CODE],
      [],
    ]);
    const testContentAdjusted = `${testContent.substring(
      0,
      8
    )}${testContent.substring(11)}`;
    const formatSelectionsAdjusted = adjustSelectionOffsetsAndCleanup(
      testFormatSelections,
      testContentAdjusted.length,
      testContent.length,
      11,
      -3
    );
    expect(toArrayWithoutIds(formatSelectionsAdjusted)).toEqual(
      toArrayWithoutIds(expectedSelections)
    );
  });
  test('delete all characters (and all Selections)', () => {
    const formatSelectionsAdjusted = adjustSelectionOffsetsAndCleanup(
      testFormatSelections,
      0,
      testContent.length,
      30,
      -30
    );
    expect(toArrayWithoutIds(formatSelectionsAdjusted)).toEqual([]);
  });
  test('delete - will merge if neighboring selections have the same formats', () => {
    const expectedSelections = fromTestArray([
      [3, SELECTION_ACTION_SITEINFO],
      [3],
      [9, SELECTION_ACTION_CODE],
      [],
    ]);
    const testContentAdjusted = `${testContent.substring(
      0,
      5
    )}${testContent.substring(12)}`;
    const formatSelectionsAdjusted = adjustSelectionOffsetsAndCleanup(
      testFormatSelections,
      testContentAdjusted.length,
      testContent.length,
      12,
      -7
    );
    expect(toArrayWithoutIds(formatSelectionsAdjusted)).toEqual(
      toArrayWithoutIds(expectedSelections)
    );
  });
  test('delete - will merge with last selection if same formats', () => {
    const expectedSelections = fromTestArray([
      [3, SELECTION_ACTION_SITEINFO],
      [],
    ]);
    const testContentAdjusted = `${testContent.substring(
      0,
      6
    )}${testContent.substring(23)}`;
    const formatSelectionsAdjusted = adjustSelectionOffsetsAndCleanup(
      testFormatSelections,
      testContentAdjusted.length,
      testContent.length,
      23,
      -17
    );
    expect(toArrayWithoutIds(formatSelectionsAdjusted)).toEqual(
      toArrayWithoutIds(expectedSelections)
    );
  });
  test('delete one highlighted character at left boundary of two selections', () => {
    const expectedSelections = fromTestArray([
      [3, SELECTION_ACTION_SITEINFO],
      [3],
      [5, SELECTION_ACTION_ITALIC],
      [1],
      [9, SELECTION_ACTION_CODE],
      [],
    ]);
    const testContentAdjusted = `${testContent.substring(
      0,
      6
    )}${testContent.substring(7)}`;
    const formatSelectionsAdjusted = adjustSelectionOffsetsAndCleanup(
      testFormatSelections,
      testContentAdjusted.length,
      testContent.length,
      7,
      -1
    );
    expect(toArrayWithoutIds(formatSelectionsAdjusted)).toEqual(
      toArrayWithoutIds(expectedSelections)
    );
  });
  test('delete one character at the right boundary of two selections', () => {
    const expectedSelections = fromTestArray([
      [3, SELECTION_ACTION_SITEINFO],
      [3],
      [5, SELECTION_ACTION_ITALIC],
      [1],
      [9, SELECTION_ACTION_CODE],
      [],
    ]);
    const testContentAdjusted = `${testContent.substring(
      0,
      11
    )}${testContent.substring(12)}`;
    const formatSelectionsAdjusted = adjustSelectionOffsetsAndCleanup(
      testFormatSelections,
      testContentAdjusted.length,
      testContent.length,
      12,
      -1
    );
    expect(toArrayWithoutIds(formatSelectionsAdjusted)).toEqual(
      toArrayWithoutIds(expectedSelections)
    );
  });
  test("delete last character of last selection with formats, model should have 'selections' unset", () => {
    const testSelections = fromTestArray([
      [13],
      [1, SELECTION_ACTION_CODE],
      [],
    ]);
    const testContentAdjusted = `${testContent.substring(
      0,
      13
    )}${testContent.substring(14)}`;

    const formatSelectionsAdjusted = adjustSelectionOffsetsAndCleanup(
      testSelections,
      testContentAdjusted.length,
      testContent.length,
      14,
      -1
    );
    expect(toArrayWithoutIds(formatSelectionsAdjusted)).toEqual([]);
  });
  test('paste a word with collapsed caret (similar to adding one character on keypress)', () => {
    const expectedSelections = fromTestArray([
      [3, SELECTION_ACTION_SITEINFO],
      [7],
      [6, SELECTION_ACTION_ITALIC],
      [1],
      [9, SELECTION_ACTION_CODE],
      [],
    ]);
    const testContentAdjusted = `${testContent.substring(
      0,
      5
    )}pple${testContent.substring(5)}`;
    const formatSelectionsAdjusted = adjustSelectionOffsetsAndCleanup(
      testFormatSelections,
      testContentAdjusted.length,
      testContent.length,
      5,
      4
    );
    expect(toArrayWithoutIds(formatSelectionsAdjusted)).toEqual(
      toArrayWithoutIds(expectedSelections)
    );
  });
  test('paste a word at edge of last selection (noop)', () => {
    const expectedSelections = fromTestArray([
      [3, SELECTION_ACTION_SITEINFO],
      [3],
      [6, SELECTION_ACTION_ITALIC],
      [1],
      [9, SELECTION_ACTION_CODE],
      [],
    ]);
    const testContentAdjusted = `${testContent.substring(
      0,
      22
    )} just${testContent.substring(22)}`;
    const formatSelectionsAdjusted = adjustSelectionOffsetsAndCleanup(
      testFormatSelections,
      testContentAdjusted.length,
      testContent.length,
      22,
      5
    );
    expect(toArrayWithoutIds(formatSelectionsAdjusted)).toEqual(
      toArrayWithoutIds(expectedSelections)
    );
  });
  test('add a letter to the end of content (noop)', () => {
    const expectedSelections = fromTestArray([
      [3, SELECTION_ACTION_SITEINFO],
      [3],
      [6, SELECTION_ACTION_ITALIC],
      [1],
      [9, SELECTION_ACTION_CODE],
      [],
    ]);
    const testContentAdjusted = `${testContent}X`;
    const formatSelectionsAdjusted = adjustSelectionOffsetsAndCleanup(
      testFormatSelections,
      testContentAdjusted.length,
      testContent.length,
      30,
      1
    );
    expect(toArrayWithoutIds(formatSelectionsAdjusted)).toEqual(
      toArrayWithoutIds(expectedSelections)
    );
  });
  test('noop - default arguments', () => {
    const formatSelectionsAdjusted = adjustSelectionOffsetsAndCleanup(
      testFormatSelections,
      testContent.length,
      testContent.length
    );
    expect(toArrayWithoutIds(formatSelectionsAdjusted)).toEqual(
      toArrayWithoutIds(testFormatSelections)
    );
  });
  test('add a word to the end of content with 1 selection (noop)', () => {
    const testSelections = fromTestArray([[, SELECTION_ACTION_SITEINFO]]);
    const testContentAdjusted = `${testContent}Slappy`;
    const formatSelectionsAdjusted = adjustSelectionOffsetsAndCleanup(
      testSelections,
      testContentAdjusted.length,
      testContent.length,
      30,
      6
    );
    expect(toArrayWithoutIds(formatSelectionsAdjusted)).toEqual(
      toArrayWithoutIds(testSelections)
    );
  });
  test('start or end out of bounds should throw', () => {
    expect(() => {
      adjustSelectionOffsetsAndCleanup(
        testFormatSelections,
        testContent.length,
        testContent.length,
        -1,
        10
      );
    }).toThrow();
    expect(() => {
      adjustSelectionOffsetsAndCleanup(
        testFormatSelections,
        testContent.length,
        testContent.length,
        25,
        10
      );
    }).toThrow();
    expect(() => {
      adjustSelectionOffsetsAndCleanup(
        testFormatSelections,
        testContent.length,
        testContent.length,
        31,
        -12
      );
    }).toThrow();
    expect(() => {
      adjustSelectionOffsetsAndCleanup(
        testFormatSelections,
        testContent.length,
        testContent.length,
        12,
        -15
      );
    }).toThrow();
  });
});

describe('getSelectionByContentOffset', () => {
  test('finds existing selection, preserves existing formats', () => {
    const expectedSelectionId = s4();
    const expectedSelections = fromTestArray([
      [3, SELECTION_ACTION_SITEINFO],
      [3],
      [6, SELECTION_ACTION_ITALIC],
      [1],
      [
        9,
        SELECTION_ACTION_LINK,
        { key: SELECTION_LINK_URL, value: 'http://foo.bar' },
        { key: LINKED_LIST_NODE_ID, value: expectedSelectionId },
      ],
      [],
    ]);
    const { formatSelections, id } = getSelectionByContentOffset(
      expectedSelections,
      testContent.length,
      13,
      22
    );
    expect(toArrayWithoutIds(formatSelections)).toEqual(
      toArrayWithoutIds(expectedSelections)
    );
    expect(id).toEqual(expectedSelectionId);
  });
  test('finds existing selection, last selection', () => {
    const expectedSelectionId = s4();
    const expectedSelections = fromTestArray([
      [3, SELECTION_ACTION_SITEINFO],
      [3],
      [6, SELECTION_ACTION_ITALIC],
      [1],
      [
        9,
        SELECTION_ACTION_LINK,
        { key: SELECTION_LINK_URL, value: 'http://foo.bar' },
      ],
      [, { key: LINKED_LIST_NODE_ID, value: expectedSelectionId }],
    ]);
    const { formatSelections, id } = getSelectionByContentOffset(
      expectedSelections,
      testContent.length,
      22,
      30
    );
    expect(toArrayWithoutIds(formatSelections)).toEqual(
      toArrayWithoutIds(expectedSelections)
    );
    expect(id).toEqual(expectedSelectionId);
  });
  test('creates new selection - somewhere in the middle, replacing other selections', () => {
    const expectedSelections = fromTestArray([
      [3, SELECTION_ACTION_SITEINFO],
      [2],
      [11, SELECTION_ACTION_ITALIC, SELECTION_ACTION_CODE],
      [6, SELECTION_ACTION_CODE],
      [],
    ]);
    const { formatSelections, id } = getSelectionByContentOffset(
      testFormatSelections,
      testContent.length,
      5,
      16
    );
    expect(toArrayWithoutIds(formatSelections)).toEqual(
      toArrayWithoutIds(expectedSelections)
    );
    expect(indexOf(formatSelections, id)).toEqual(2);
  });
  test('creates new selection - replaces first (head) selection', () => {
    const expectedSelections = fromTestArray([
      [8, SELECTION_ACTION_SITEINFO, SELECTION_ACTION_ITALIC],
      [4, SELECTION_ACTION_ITALIC],
      [1],
      [9, SELECTION_ACTION_CODE],
      [],
    ]);
    const { formatSelections, id } = getSelectionByContentOffset(
      testFormatSelections,
      testContent.length,
      0,
      8
    );
    expect(toArrayWithoutIds(formatSelections)).toEqual(
      toArrayWithoutIds(expectedSelections)
    );
    expect(indexOf(formatSelections, id)).toEqual(0);
  });
  test('creates new selection - replaces part of first (head) selection', () => {
    const expectedSelections = fromTestArray([
      [1, SELECTION_ACTION_SITEINFO],
      [2, SELECTION_ACTION_SITEINFO],
      [3],
      [6, SELECTION_ACTION_ITALIC],
      [1],
      [9, SELECTION_ACTION_CODE],
      [],
    ]);
    const { formatSelections, id } = getSelectionByContentOffset(
      testFormatSelections,
      testContent.length,
      0,
      1
    );
    expect(toArrayWithoutIds(formatSelections)).toEqual(
      toArrayWithoutIds(expectedSelections)
    );
    expect(indexOf(formatSelections, id)).toEqual(0);
  });
  test('creates new selection - replaces first (head) selection - empty selections', () => {
    const emptySelections = linkedListFromJS();
    const expectedSelections = fromTestArray([[8], []]);
    const { formatSelections, id } = getSelectionByContentOffset(
      emptySelections,
      testContent.length,
      0,
      8
    );
    expect(toArrayWithoutIds(formatSelections)).toEqual(
      toArrayWithoutIds(expectedSelections)
    );
    expect(indexOf(formatSelections, id)).toEqual(0);
  });
  test('creates new selection - middle through replaces last selection', () => {
    const expectedSelections = fromTestArray([
      [3, SELECTION_ACTION_SITEINFO],
      [3],
      [6, SELECTION_ACTION_ITALIC],
      [-1, SELECTION_ACTION_CODE],
    ]);
    const { formatSelections, id } = getSelectionByContentOffset(
      testFormatSelections,
      testContent.length,
      12,
      30
    );
    expect(toArrayWithoutIds(formatSelections)).toEqual(
      toArrayWithoutIds(expectedSelections)
    );
    expect(indexOf(formatSelections, id)).toEqual(3);
  });
  test('creates new selection - replaces 2nd half of last selection', () => {
    const expectedSelections = fromTestArray([
      [3, SELECTION_ACTION_SITEINFO],
      [3],
      [6, SELECTION_ACTION_ITALIC],
      [1],
      [9, SELECTION_ACTION_CODE],
      [3],
      [],
    ]);
    const { formatSelections, id } = getSelectionByContentOffset(
      testFormatSelections,
      testContent.length,
      25,
      30
    );
    expect(toArrayWithoutIds(formatSelections)).toEqual(
      toArrayWithoutIds(expectedSelections)
    );
    expect(indexOf(formatSelections, id)).toEqual(6);
  });
  test('creates new selection - replaces up to last selection', () => {
    const expectedSelections = fromTestArray([
      [3, SELECTION_ACTION_SITEINFO],
      [3],
      [6, SELECTION_ACTION_ITALIC],
      [16, SELECTION_ACTION_CODE],
      [],
    ]);
    const { formatSelections, id } = getSelectionByContentOffset(
      testFormatSelections,
      testContent.length,
      12,
      28
    );
    expect(toArrayWithoutIds(formatSelections)).toEqual(
      toArrayWithoutIds(expectedSelections)
    );
    expect(indexOf(formatSelections, id)).toEqual(3);
  });
  test('creates new selection - completely within existing selection', () => {
    const expectedSelections = fromTestArray([
      [3, SELECTION_ACTION_SITEINFO],
      [3],
      [6, SELECTION_ACTION_ITALIC],
      [1],
      [3, SELECTION_ACTION_CODE],
      [3, SELECTION_ACTION_CODE],
      [3, SELECTION_ACTION_CODE],
      [],
    ]);
    const { formatSelections, id } = getSelectionByContentOffset(
      testFormatSelections,
      testContent.length,
      16,
      19
    );
    expect(toArrayWithoutIds(formatSelections)).toEqual(
      toArrayWithoutIds(expectedSelections)
    );
    expect(indexOf(formatSelections, id)).toEqual(5);
  });
  test('creates new selection - completely within last selection', () => {
    const expectedSelections = fromTestArray([
      [3, SELECTION_ACTION_SITEINFO],
      [3],
      [6, SELECTION_ACTION_ITALIC],
      [1],
      [9, SELECTION_ACTION_CODE],
      [3],
      [3],
      [],
    ]);
    const { formatSelections, id } = getSelectionByContentOffset(
      testFormatSelections,
      testContent.length,
      25,
      28
    );
    expect(toArrayWithoutIds(formatSelections)).toEqual(
      toArrayWithoutIds(expectedSelections)
    );
    expect(indexOf(formatSelections, id)).toEqual(6);
  });
  test('creates new selection - replaces more than one selection evenly', () => {
    const expectedSelections = fromTestArray([
      [3, SELECTION_ACTION_SITEINFO],
      [10, SELECTION_ACTION_ITALIC],
      [9, SELECTION_ACTION_CODE],
      [],
    ]);
    const { formatSelections, id } = getSelectionByContentOffset(
      testFormatSelections,
      testContent.length,
      3,
      13
    );
    expect(toArrayWithoutIds(formatSelections)).toEqual(
      toArrayWithoutIds(expectedSelections)
    );
    expect(indexOf(formatSelections, id)).toEqual(1);
  });
  test('creates new selection - replaces all selections evenly', () => {
    const expectedSelections = fromTestArray([
      [
        ,
        SELECTION_ACTION_SITEINFO,
        SELECTION_ACTION_ITALIC,
        SELECTION_ACTION_CODE,
      ],
    ]);
    const { formatSelections, id } = getSelectionByContentOffset(
      testFormatSelections,
      testContent.length,
      0,
      30
    );
    expect(toArrayWithoutIds(formatSelections)).toEqual(
      toArrayWithoutIds(expectedSelections)
    );
    expect(indexOf(formatSelections, id)).toEqual(0);
  });
  test('creates new selection - replaces 2nd half of head, 1st half of last selection', () => {
    const expectedSelections = fromTestArray([
      [2, SELECTION_ACTION_SITEINFO],
      [
        26,
        SELECTION_ACTION_SITEINFO,
        SELECTION_ACTION_ITALIC,
        SELECTION_ACTION_CODE,
      ],
      [],
    ]);
    const { formatSelections, id } = getSelectionByContentOffset(
      testFormatSelections,
      testContent.length,
      2,
      28
    );
    expect(toArrayWithoutIds(formatSelections)).toEqual(
      toArrayWithoutIds(expectedSelections)
    );
    expect(indexOf(formatSelections, id)).toEqual(1);
  });
});

describe('replaceSelection', () => {
  test('replaces (updates) a "matched" Selection in the middle', () => {
    // simulates an "update" of an existing selection
    let updatedSelection = getAt(testFormatSelections, 2);
    updatedSelection = setSiteinfo(updatedSelection, true);
    const expectedSelections = fromTestArray([
      [3, SELECTION_ACTION_SITEINFO],
      [3],
      [6, SELECTION_ACTION_ITALIC, SELECTION_ACTION_SITEINFO],
      [1],
      [9, SELECTION_ACTION_CODE],
      [],
    ]);
    testFormatSelections = replaceSelection(
      testFormatSelections,
      updatedSelection
    );
    expect(toArrayWithoutIds(testFormatSelections)).toEqual(
      toArrayWithoutIds(expectedSelections)
    );
  });
  test('replaces and merges Selections - in the middle', () => {
    let updatedSelection = getAt(testFormatSelections, 2);
    updatedSelection = setItalic(updatedSelection, false);
    const expectedSelections = fromTestArray([
      [3, SELECTION_ACTION_SITEINFO],
      [10],
      [9, SELECTION_ACTION_CODE],
      [],
    ]);
    testFormatSelections = replaceSelection(
      testFormatSelections,
      updatedSelection
    );
    expect(toArrayWithoutIds(testFormatSelections)).toEqual(
      toArrayWithoutIds(expectedSelections)
    );
  });
  test('replaces a Selection (no merge) - first (head) selection', () => {
    let updatedSelection = getAt(testFormatSelections, 0);
    updatedSelection = setSiteinfo(updatedSelection, false);
    updatedSelection = setMini(updatedSelection, true);
    const expectedSelections = fromTestArray([
      [3, SELECTION_ACTION_MINI],
      [3],
      [6, SELECTION_ACTION_ITALIC],
      [1],
      [9, SELECTION_ACTION_CODE],
      [],
    ]);
    testFormatSelections = replaceSelection(
      testFormatSelections,
      updatedSelection
    );
    expect(toArrayWithoutIds(testFormatSelections)).toEqual(
      toArrayWithoutIds(expectedSelections)
    );
  });
  test('replaces and merges Selection - first (head) selection', () => {
    let updatedSelection = getAt(testFormatSelections, 0);
    updatedSelection = setSiteinfo(updatedSelection, false);
    const expectedSelections = fromTestArray([
      [6],
      [6, SELECTION_ACTION_ITALIC],
      [1],
      [9, SELECTION_ACTION_CODE],
      [],
    ]);
    testFormatSelections = replaceSelection(
      testFormatSelections,
      updatedSelection
    );
    expect(toArrayWithoutIds(testFormatSelections)).toEqual(
      toArrayWithoutIds(expectedSelections)
    );
  });
  test('replaces and merges Selection - last selection', () => {
    let updatedSelection = getAt(testFormatSelections, 5);
    updatedSelection = setCode(updatedSelection, true);
    const expectedSelections = fromTestArray([
      [3, SELECTION_ACTION_SITEINFO],
      [3],
      [6, SELECTION_ACTION_ITALIC],
      [1],
      [, SELECTION_ACTION_CODE],
    ]);
    testFormatSelections = replaceSelection(
      testFormatSelections,
      updatedSelection
    );
    expect(toArrayWithoutIds(testFormatSelections)).toEqual(
      toArrayWithoutIds(expectedSelections)
    );
  });
  test('replaces and merges Selection - 2nd to last selection', () => {
    let updatedSelection = getAt(testFormatSelections, 4);
    updatedSelection = setCode(updatedSelection, false);
    const expectedSelections = fromTestArray([
      [3, SELECTION_ACTION_SITEINFO],
      [3],
      [6, SELECTION_ACTION_ITALIC],
      [],
    ]);
    testFormatSelections = replaceSelection(
      testFormatSelections,
      updatedSelection
    );
    expect(toArrayWithoutIds(testFormatSelections)).toEqual(
      toArrayWithoutIds(expectedSelections)
    );
  });
  test('should throw with bad Selection', () => {
    expect(() => {
      replaceSelection(testFormatSelections, Map());
    }).toThrow();
  });
});

describe('splitSelectionsAtCaretOffset', () => {
  test('split in middle of selection', () => {
    const expectedSelectionsLeft = fromTestArray([
      [3, SELECTION_ACTION_SITEINFO],
      [3],
      [6, SELECTION_ACTION_ITALIC],
      [1],
      [, SELECTION_ACTION_CODE],
    ]);
    const expectedSelectionsRight = fromTestArray([
      [5, SELECTION_ACTION_CODE],
      [],
    ]);
    const { left, right } = splitSelectionsAtCaretOffset(
      testFormatSelections,
      17
    );
    expect(toArrayWithoutIds(left)).toEqual(
      toArrayWithoutIds(expectedSelectionsLeft)
    );
    expect(toArrayWithoutIds(right)).toEqual(
      toArrayWithoutIds(expectedSelectionsRight)
    );
  });
  test('split at the edge of 2 Selections', () => {
    const expectedSelectionsLeft = fromTestArray([
      [3, SELECTION_ACTION_SITEINFO],
      [3],
      [6, SELECTION_ACTION_ITALIC],
      [],
    ]);
    const expectedSelectionsRight = fromTestArray([
      [9, SELECTION_ACTION_CODE],
      [],
    ]);
    const { left, right } = splitSelectionsAtCaretOffset(
      testFormatSelections,
      13
    );
    expect(toArrayWithoutIds(left)).toEqual(
      toArrayWithoutIds(expectedSelectionsLeft)
    );
    expect(toArrayWithoutIds(right)).toEqual(
      toArrayWithoutIds(expectedSelectionsRight)
    );
  });
  test('split at the edge of last Selection', () => {
    const expectedSelectionsLeft = fromTestArray([
      [3, SELECTION_ACTION_SITEINFO],
      [3],
      [6, SELECTION_ACTION_ITALIC],
      [1],
      [, SELECTION_ACTION_CODE],
    ]);
    const expectedSelectionsRight = linkedListFromJS();
    const { left, right } = splitSelectionsAtCaretOffset(
      testFormatSelections,
      22
    );
    expect(toArrayWithoutIds(left)).toEqual(
      toArrayWithoutIds(expectedSelectionsLeft)
    );
    expect(toArrayWithoutIds(right)).toEqual(
      toArrayWithoutIds(expectedSelectionsRight)
    );
  });
  test('split in the middle of last "empty" Selection', () => {
    const expectedSelectionsLeft = fromTestArray([
      [3, SELECTION_ACTION_SITEINFO],
      [3],
      [6, SELECTION_ACTION_ITALIC],
      [1],
      [9, SELECTION_ACTION_CODE],
      [],
    ]);
    const expectedSelectionsRight = linkedListFromJS();
    const { left, right } = splitSelectionsAtCaretOffset(
      testFormatSelections,
      24
    );
    expect(toArrayWithoutIds(left)).toEqual(
      toArrayWithoutIds(expectedSelectionsLeft)
    );
    expect(toArrayWithoutIds(right)).toEqual(
      toArrayWithoutIds(expectedSelectionsRight)
    );
  });
  test('split in the beginning', () => {
    const expectedSelectionsLeft = linkedListFromJS();
    const expectedSelectionsRight = fromTestArray([
      [3, SELECTION_ACTION_SITEINFO],
      [3],
      [6, SELECTION_ACTION_ITALIC],
      [1],
      [9, SELECTION_ACTION_CODE],
      [],
    ]);

    const { left, right } = splitSelectionsAtCaretOffset(
      testFormatSelections,
      0
    );
    expect(toArrayWithoutIds(left)).toEqual(
      toArrayWithoutIds(expectedSelectionsLeft)
    );
    expect(toArrayWithoutIds(right)).toEqual(
      toArrayWithoutIds(expectedSelectionsRight)
    );
  });
});

describe('concatSelections', () => {
  test('neither left nor right model have selections', () => {
    let left = linkedListFromJS();
    let right = linkedListFromJS();
    let updated = concatSelections(left, right, testContent.length);
    expect(toArrayWithoutIds(updated)).toEqual(
      toArrayWithoutIds(linkedListFromJS())
    );
  });
  test('left last selection has different formats as right first selection (no merge)', () => {
    const leftSelections = fromTestArray([
      [3, SELECTION_ACTION_SITEINFO],
      [3],
      [6, SELECTION_ACTION_ITALIC],
      [1],
      [9, SELECTION_ACTION_CODE],
      [],
    ]);
    const rightSelections = fromTestArray([
      [6, SELECTION_ACTION_MINI],
      [6, SELECTION_ACTION_ITALIC],
      [1],
      [9, SELECTION_ACTION_CODE],
      [],
    ]);
    const expectedSelections = fromTestArray([
      [3, SELECTION_ACTION_SITEINFO],
      [3],
      [6, SELECTION_ACTION_ITALIC],
      [1],
      [9, SELECTION_ACTION_CODE],
      [8],
      [6, SELECTION_ACTION_MINI],
      [6, SELECTION_ACTION_ITALIC],
      [1],
      [9, SELECTION_ACTION_CODE],
      [],
    ]);
    const updated = concatSelections(
      leftSelections,
      rightSelections,
      testContent.length
    );
    expect(toArrayWithoutIds(updated)).toEqual(
      toArrayWithoutIds(expectedSelections)
    );
  });
  test('left last selection has same formats as right first selection (merge)', () => {
    const leftSelections = fromTestArray([
      [3, SELECTION_ACTION_SITEINFO],
      [3],
      [6, SELECTION_ACTION_ITALIC],
      [1],
      [9, SELECTION_ACTION_CODE],
      [],
    ]);
    const rightSelections = fromTestArray([
      [6],
      [6, SELECTION_ACTION_ITALIC],
      [1],
      [9, SELECTION_ACTION_CODE],
      [],
    ]);
    const expectedSelections = fromTestArray([
      [3, SELECTION_ACTION_SITEINFO],
      [3],
      [6, SELECTION_ACTION_ITALIC],
      [1],
      [9, SELECTION_ACTION_CODE],
      [14],
      [6, SELECTION_ACTION_ITALIC],
      [1],
      [9, SELECTION_ACTION_CODE],
      [],
    ]);
    const updated = concatSelections(
      leftSelections,
      rightSelections,
      testContent.length
    );
    expect(toArrayWithoutIds(updated)).toEqual(
      toArrayWithoutIds(expectedSelections)
    );
  });
  test('left has no selections, right has selections', () => {
    const leftSelections = linkedListFromJS();
    const rightSelections = fromTestArray([
      [3, SELECTION_ACTION_SITEINFO],
      [3],
      [6, SELECTION_ACTION_ITALIC],
      [1],
      [9, SELECTION_ACTION_CODE],
      [],
    ]);
    const expectedSelections = fromTestArray([
      [30],
      [3, SELECTION_ACTION_SITEINFO],
      [3],
      [6, SELECTION_ACTION_ITALIC],
      [1],
      [9, SELECTION_ACTION_CODE],
      [],
    ]);
    const updated = concatSelections(
      leftSelections,
      rightSelections,
      testContent.length
    );
    expect(toArrayWithoutIds(updated)).toEqual(
      toArrayWithoutIds(expectedSelections)
    );
  });
  test('left has selections, right nas no selections', () => {
    const leftSelections = fromTestArray([
      [3, SELECTION_ACTION_SITEINFO],
      [3],
      [6, SELECTION_ACTION_ITALIC],
      [1],
      [9, SELECTION_ACTION_CODE],
      [],
    ]);
    const rightSelections = linkedListFromJS();
    const updated = concatSelections(
      leftSelections,
      rightSelections,
      testContent.length
    );
    expect(toArrayWithoutIds(updated)).toEqual(
      toArrayWithoutIds(leftSelections)
    );
  });
});

describe('getContentBySelections', () => {
  test('returns an array of content pieces broken out by selection lengths', () => {
    expect(getContentBySelections(testFormatSelections, testContent)).toEqual([
      'And',
      ' a ',
      'second',
      ' ',
      'paragraph',
      ' because',
    ]);
  });
  test('returns an array of one string with all content when no selections', () => {
    const formatSelections = linkedListFromJS();
    expect(getContentBySelections(formatSelections, testContent)).toEqual([
      testContent,
    ]);
  });
  test('returns an array of strings with 1 zero-length char for each Selection if content is null or undefined', () => {
    const zeroLengthPlaceholders = Array(6)
      .fill('')
      .map((s) => cleanTextOrZeroLengthPlaceholder(s));
    expect(getContentBySelections(testFormatSelections, null)).toEqual(
      zeroLengthPlaceholders
    );
    expect(getContentBySelections(testFormatSelections, undefined)).toEqual(
      zeroLengthPlaceholders
    );
  });
});
