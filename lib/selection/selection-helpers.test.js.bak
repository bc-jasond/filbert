import {
  SELECTION_ACTION_BOLD,
  SELECTION_ACTION_CODE,
  SELECTION_ACTION_ITALIC,
  SELECTION_ACTION_LINK,
  SELECTION_ACTION_MINI,
  SELECTION_ACTION_SITEINFO,
  SELECTION_LINK_URL,
  FormatSelections,
  FormatSelectionNode,
} from './selection-helpers.mjs';
import { cleanTextOrZeroLengthPlaceholder, s4 } from '@filbert/util';

const testContent = 'And a second paragraph because';
let testFormatSelections;

beforeAll(() => {
  console.debug = () => {};
  console.info = () => {};
  console.log = () => {};
});

beforeEach(() => {
  testFormatSelections = FormatSelections.fromTestArray([
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
    const expectedSelections = FormatSelections.fromTestArray([
      [5, SELECTION_ACTION_CODE],
      [],
    ]);
    const testContentAdjusted = testContent.substring(17);
    const formatSelectionsAdjusted = testFormatSelections.adjustSelectionOffsetsAndCleanup(
      testContentAdjusted.length,
      testContent.length,
      17,
      -17
    );
    expect(formatSelectionsAdjusted.toArrayWithoutIds()).toEqual(
      expectedSelections.toArrayWithoutIds()
    );
  });
  test('delete all highlighted characters up to caret (up to edge of a selection)', () => {
    const prevContent = 'and some paragraph for good measure?';
    const expectedSelections = FormatSelections.fromTestArray([
      [9],
      [9, SELECTION_ACTION_CODE],
      [],
    ]);
    const testContentAdjusted = 'and some paragraph for  measure?';
    const testFormatSelections = FormatSelections.fromTestArray([
      [9],
      [9, SELECTION_ACTION_CODE],
      [5],
      [4, SELECTION_ACTION_BOLD, SELECTION_ACTION_ITALIC],
      [],
    ]);
    const formatSelectionsAdjusted = testFormatSelections.adjustSelectionOffsetsAndCleanup(
      testContentAdjusted.length,
      prevContent.length,
      27,
      -4
    );
    expect(formatSelectionsAdjusted.toArrayWithoutIds()).toEqual(
      expectedSelections.toArrayWithoutIds()
    );
  });
  test('delete all highlighted characters from caret through the end (when "start" with multiple nodes in handleBackspace)', () => {
    const expectedSelections = FormatSelections.fromTestArray([
      [3, SELECTION_ACTION_SITEINFO],
      [3],
      [6, SELECTION_ACTION_ITALIC],
      [1],
      [, SELECTION_ACTION_CODE],
    ]);
    const testContentAdjusted = testContent.substring(0, 17);
    const formatSelectionsAdjusted = testFormatSelections.adjustSelectionOffsetsAndCleanup(
      testContentAdjusted.length,
      testContent.length,
      30,
      -13
    );
    expect(formatSelectionsAdjusted.toArrayWithoutIds()).toEqual(
      expectedSelections.toArrayWithoutIds()
    );
  });
  test('delete highlighted characters from middle, deletes a selection, adjusts overlapping selections', () => {
    const expectedSelections = FormatSelections.fromTestArray([
      [3, SELECTION_ACTION_SITEINFO],
      [1],
      [5, SELECTION_ACTION_CODE],
      [],
    ]);
    const testContentAdjusted = `${testContent.substring(
      0,
      4
    )}${testContent.substring(17)}`;
    const formatSelectionsAdjusted = testFormatSelections.adjustSelectionOffsetsAndCleanup(
      testContentAdjusted.length,
      testContent.length,
      17,
      -13
    );
    expect(formatSelectionsAdjusted.toArrayWithoutIds()).toEqual(
      expectedSelections.toArrayWithoutIds()
    );
  });
  test('delete highlighted characters from one whole selection evenly', () => {
    const expectedSelections = FormatSelections.fromTestArray([
      [3, SELECTION_ACTION_SITEINFO],
      [4],
      [9, SELECTION_ACTION_CODE],
      [],
    ]);
    const testContentAdjusted = `${testContent.substring(
      0,
      6
    )}${testContent.substring(12)}`;
    const formatSelectionsAdjusted = testFormatSelections.adjustSelectionOffsetsAndCleanup(
      testContentAdjusted.length,
      testContent.length,
      12,
      -6
    );
    expect(formatSelectionsAdjusted.toArrayWithoutIds()).toEqual(
      expectedSelections.toArrayWithoutIds()
    );
  });
  test('delete highlighted characters from middle of one selection', () => {
    const expectedSelections = FormatSelections.fromTestArray([
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
    const formatSelectionsAdjusted = testFormatSelections.adjustSelectionOffsetsAndCleanup(
      testContentAdjusted.length,
      testContent.length,
      11,
      -3
    );
    expect(formatSelectionsAdjusted.toArrayWithoutIds()).toEqual(
      expectedSelections.toArrayWithoutIds()
    );
  });
  test('delete all characters (and all Selections)', () => {
    const formatSelectionsAdjusted = testFormatSelections.adjustSelectionOffsetsAndCleanup(
      0,
      testContent.length,
      30,
      -30
    );
    expect(formatSelectionsAdjusted.toArrayWithoutIds()).toEqual([]);
  });
  test('delete - will merge if neighboring selections have the same formats', () => {
    const expectedSelections = FormatSelections.fromTestArray([
      [3, SELECTION_ACTION_SITEINFO],
      [3],
      [9, SELECTION_ACTION_CODE],
      [],
    ]);
    const testContentAdjusted = `${testContent.substring(
      0,
      5
    )}${testContent.substring(12)}`;
    const formatSelectionsAdjusted = testFormatSelections.adjustSelectionOffsetsAndCleanup(
      testContentAdjusted.length,
      testContent.length,
      12,
      -7
    );
    expect(formatSelectionsAdjusted.toArrayWithoutIds()).toEqual(
      expectedSelections.toArrayWithoutIds()
    );
  });
  test('delete - will merge with last selection if same formats', () => {
    const expectedSelections = FormatSelections.fromTestArray([
      [3, SELECTION_ACTION_SITEINFO],
      [],
    ]);
    const testContentAdjusted = `${testContent.substring(
      0,
      6
    )}${testContent.substring(23)}`;
    const formatSelectionsAdjusted = testFormatSelections.adjustSelectionOffsetsAndCleanup(
      testContentAdjusted.length,
      testContent.length,
      23,
      -17
    );
    expect(formatSelectionsAdjusted.toArrayWithoutIds()).toEqual(
      expectedSelections.toArrayWithoutIds()
    );
  });
  test('delete one highlighted character at left boundary of two selections', () => {
    const expectedSelections = FormatSelections.fromTestArray([
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
    const formatSelectionsAdjusted = testFormatSelections.adjustSelectionOffsetsAndCleanup(
      testContentAdjusted.length,
      testContent.length,
      7,
      -1
    );
    expect(formatSelectionsAdjusted.toArrayWithoutIds()).toEqual(
      expectedSelections.toArrayWithoutIds()
    );
  });
  test('delete one character at the right boundary of two selections', () => {
    const expectedSelections = FormatSelections.fromTestArray([
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
    const formatSelectionsAdjusted = testFormatSelections.adjustSelectionOffsetsAndCleanup(
      testContentAdjusted.length,
      testContent.length,
      12,
      -1
    );
    expect(formatSelectionsAdjusted.toArrayWithoutIds()).toEqual(
      expectedSelections.toArrayWithoutIds()
    );
  });
  test("delete last character of last selection with formats, model should have 'selections' unset", () => {
    const testSelections = FormatSelections.fromTestArray([
      [13],
      [1, SELECTION_ACTION_CODE],
      [],
    ]);
    const testContentAdjusted = `${testContent.substring(
      0,
      13
    )}${testContent.substring(14)}`;

    const formatSelectionsAdjusted = testSelections.adjustSelectionOffsetsAndCleanup(
      testContentAdjusted.length,
      testContent.length,
      14,
      -1
    );
    expect(formatSelectionsAdjusted.toArrayWithoutIds()).toEqual([]);
  });
  test('paste a word with collapsed caret (similar to adding one character on keypress)', () => {
    const expectedSelections = FormatSelections.fromTestArray([
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
    const formatSelectionsAdjusted = testFormatSelections.adjustSelectionOffsetsAndCleanup(
      testContentAdjusted.length,
      testContent.length,
      5,
      4
    );
    expect(formatSelectionsAdjusted.toArrayWithoutIds()).toEqual(
      expectedSelections.toArrayWithoutIds()
    );
  });
  test('paste a word at edge of last selection (noop)', () => {
    const expectedSelections = FormatSelections.fromTestArray([
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
    const formatSelectionsAdjusted = testFormatSelections.adjustSelectionOffsetsAndCleanup(
      testContentAdjusted.length,
      testContent.length,
      22,
      5
    );
    expect(formatSelectionsAdjusted.toArrayWithoutIds()).toEqual(
      expectedSelections.toArrayWithoutIds()
    );
  });
  test('add a letter to the end of content (noop)', () => {
    const expectedSelections = FormatSelections.fromTestArray([
      [3, SELECTION_ACTION_SITEINFO],
      [3],
      [6, SELECTION_ACTION_ITALIC],
      [1],
      [9, SELECTION_ACTION_CODE],
      [],
    ]);
    const testContentAdjusted = `${testContent}X`;
    const formatSelectionsAdjusted = testFormatSelections.adjustSelectionOffsetsAndCleanup(
      testContentAdjusted.length,
      testContent.length,
      30,
      1
    );
    expect(formatSelectionsAdjusted.toArrayWithoutIds()).toEqual(
      expectedSelections.toArrayWithoutIds()
    );
  });
  test('noop - default arguments', () => {
    const formatSelectionsAdjusted = testFormatSelections.adjustSelectionOffsetsAndCleanup(
      testContent.length,
      testContent.length
    );
    expect(formatSelectionsAdjusted.toArrayWithoutIds()).toEqual(
      testFormatSelections.toArrayWithoutIds()
    );
  });
  test('add a word to the end of content with 1 selection (noop)', () => {
    const testSelections = FormatSelections.fromTestArray([
      [, SELECTION_ACTION_SITEINFO],
    ]);
    const testContentAdjusted = `${testContent}Slappy`;
    const formatSelectionsAdjusted = testSelections.adjustSelectionOffsetsAndCleanup(
      testContentAdjusted.length,
      testContent.length,
      30,
      6
    );
    expect(formatSelectionsAdjusted.toArrayWithoutIds()).toEqual(
      testSelections.toArrayWithoutIds()
    );
  });
  test('start or end out of bounds should throw', () => {
    expect(() => {
      testFormatSelections.adjustSelectionOffsetsAndCleanup(
        testContent.length,
        testContent.length,
        -1,
        10
      );
    }).toThrow();
    expect(() => {
      testFormatSelections.adjustSelectionOffsetsAndCleanup(
        testContent.length,
        testContent.length,
        25,
        10
      );
    }).toThrow();
    expect(() => {
      testFormatSelections.adjustSelectionOffsetsAndCleanup(
        testContent.length,
        testContent.length,
        31,
        -12
      );
    }).toThrow();
    expect(() => {
      testFormatSelections.adjustSelectionOffsetsAndCleanup(
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
    const expectedSelections = FormatSelections.fromTestArray([
      [3, SELECTION_ACTION_SITEINFO],
      [3],
      [6, SELECTION_ACTION_ITALIC],
      [1],
      [
        9,
        SELECTION_ACTION_LINK,
        { key: SELECTION_LINK_URL, value: 'http://foo.bar' },
        { key: SELECTION_ID, value: expectedSelectionId },
      ],
      [],
    ]);
    const {
      formatSelections,
      id,
    } = expectedSelections.getSelectionByContentOffset(
      testContent.length,
      13,
      22
    );
    expect(formatSelections.toArrayWithoutIds()).toEqual(
      expectedSelections.toArrayWithoutIds()
    );
    expect(id).toEqual(expectedSelectionId);
  });
  test('finds existing selection, last selection', () => {
    const expectedSelectionId = s4();
    const expectedSelections = FormatSelections.fromTestArray([
      [3, SELECTION_ACTION_SITEINFO],
      [3],
      [6, SELECTION_ACTION_ITALIC],
      [1],
      [
        9,
        SELECTION_ACTION_LINK,
        { key: SELECTION_LINK_URL, value: 'http://foo.bar' },
      ],
      [, { key: SELECTION_ID, value: expectedSelectionId }],
    ]);
    const {
      formatSelections,
      id,
    } = expectedSelections.getSelectionByContentOffset(
      testContent.length,
      22,
      30
    );
    expect(formatSelections.toArrayWithoutIds()).toEqual(
      expectedSelections.toArrayWithoutIds()
    );
    expect(id).toEqual(expectedSelectionId);
  });
  test('creates new selection - somewhere in the middle, replacing other selections', () => {
    const expectedSelections = FormatSelections.fromTestArray([
      [3, SELECTION_ACTION_SITEINFO],
      [2],
      [11, SELECTION_ACTION_ITALIC, SELECTION_ACTION_CODE],
      [6, SELECTION_ACTION_CODE],
      [],
    ]);
    const {
      formatSelections,
      id,
    } = testFormatSelections.getSelectionByContentOffset(
      testContent.length,
      5,
      16
    );
    expect(formatSelections.toArrayWithoutIds()).toEqual(
      expectedSelections.toArrayWithoutIds()
    );
    expect(formatSelections.indexOf(id)).toEqual(2);
  });
  test('creates new selection - replaces first (head) selection', () => {
    const expectedSelections = FormatSelections.fromTestArray([
      [8, SELECTION_ACTION_SITEINFO, SELECTION_ACTION_ITALIC],
      [4, SELECTION_ACTION_ITALIC],
      [1],
      [9, SELECTION_ACTION_CODE],
      [],
    ]);
    const {
      formatSelections,
      id,
    } = testFormatSelections.getSelectionByContentOffset(
      testContent.length,
      0,
      8
    );
    expect(formatSelections.toArrayWithoutIds()).toEqual(
      expectedSelections.toArrayWithoutIds()
    );
    expect(formatSelections.indexOf(id)).toEqual(0);
  });
  test('creates new selection - replaces part of first (head) selection', () => {
    const expectedSelections = FormatSelections.fromTestArray([
      [1, SELECTION_ACTION_SITEINFO],
      [2, SELECTION_ACTION_SITEINFO],
      [3],
      [6, SELECTION_ACTION_ITALIC],
      [1],
      [9, SELECTION_ACTION_CODE],
      [],
    ]);
    const {
      formatSelections,
      id,
    } = testFormatSelections.getSelectionByContentOffset(
      testContent.length,
      0,
      1
    );
    expect(formatSelections.toArrayWithoutIds()).toEqual(
      expectedSelections.toArrayWithoutIds()
    );
    expect(formatSelections.indexOf(id)).toEqual(0);
  });
  test('creates new selection - replaces first (head) selection - empty selections', () => {
    const emptySelections = new FormatSelections();
    const expectedSelections = FormatSelections.fromTestArray([[8], []]);
    const {
      formatSelections,
      id,
    } = emptySelections.getSelectionByContentOffset(testContent.length, 0, 8);
    expect(formatSelections.toArrayWithoutIds()).toEqual(
      expectedSelections.toArrayWithoutIds()
    );
    expect(formatSelections.indexOf(id)).toEqual(0);
  });
  test('creates new selection - middle through replaces last selection', () => {
    const expectedSelections = FormatSelections.fromTestArray([
      [3, SELECTION_ACTION_SITEINFO],
      [3],
      [6, SELECTION_ACTION_ITALIC],
      [-1, SELECTION_ACTION_CODE],
    ]);
    const {
      formatSelections,
      id,
    } = testFormatSelections.getSelectionByContentOffset(
      testContent.length,
      12,
      30
    );
    expect(formatSelections.toArrayWithoutIds()).toEqual(
      expectedSelections.toArrayWithoutIds()
    );
    expect(formatSelections.indexOf(id)).toEqual(3);
  });
  test('creates new selection - replaces 2nd half of last selection', () => {
    const expectedSelections = FormatSelections.fromTestArray([
      [3, SELECTION_ACTION_SITEINFO],
      [3],
      [6, SELECTION_ACTION_ITALIC],
      [1],
      [9, SELECTION_ACTION_CODE],
      [3],
      [],
    ]);
    const {
      formatSelections,
      id,
    } = testFormatSelections.getSelectionByContentOffset(
      testContent.length,
      25,
      30
    );
    expect(formatSelections.toArrayWithoutIds()).toEqual(
      expectedSelections.toArrayWithoutIds()
    );
    expect(formatSelections.indexOf(id)).toEqual(6);
  });
  test('creates new selection - replaces up to last selection', () => {
    const expectedSelections = FormatSelections.fromTestArray([
      [3, SELECTION_ACTION_SITEINFO],
      [3],
      [6, SELECTION_ACTION_ITALIC],
      [16, SELECTION_ACTION_CODE],
      [],
    ]);
    const {
      formatSelections,
      id,
    } = testFormatSelections.getSelectionByContentOffset(
      testContent.length,
      12,
      28
    );
    expect(formatSelections.toArrayWithoutIds()).toEqual(
      expectedSelections.toArrayWithoutIds()
    );
    expect(formatSelections.indexOf(id)).toEqual(3);
  });
  test('creates new selection - completely within existing selection', () => {
    const expectedSelections = FormatSelections.fromTestArray([
      [3, SELECTION_ACTION_SITEINFO],
      [3],
      [6, SELECTION_ACTION_ITALIC],
      [1],
      [3, SELECTION_ACTION_CODE],
      [3, SELECTION_ACTION_CODE],
      [3, SELECTION_ACTION_CODE],
      [],
    ]);
    const {
      formatSelections,
      id,
    } = testFormatSelections.getSelectionByContentOffset(
      testContent.length,
      16,
      19
    );
    expect(formatSelections.toArrayWithoutIds()).toEqual(
      expectedSelections.toArrayWithoutIds()
    );
    expect(formatSelections.indexOf(id)).toEqual(5);
  });
  test('creates new selection - completely within last selection', () => {
    const expectedSelections = FormatSelections.fromTestArray([
      [3, SELECTION_ACTION_SITEINFO],
      [3],
      [6, SELECTION_ACTION_ITALIC],
      [1],
      [9, SELECTION_ACTION_CODE],
      [3],
      [3],
      [],
    ]);
    const {
      formatSelections,
      id,
    } = testFormatSelections.getSelectionByContentOffset(
      testContent.length,
      25,
      28
    );
    expect(formatSelections.toArrayWithoutIds()).toEqual(
      expectedSelections.toArrayWithoutIds()
    );
    expect(formatSelections.indexOf(id)).toEqual(6);
  });
  test('creates new selection - replaces more than one selection evenly', () => {
    const expectedSelections = FormatSelections.fromTestArray([
      [3, SELECTION_ACTION_SITEINFO],
      [10, SELECTION_ACTION_ITALIC],
      [9, SELECTION_ACTION_CODE],
      [],
    ]);
    const {
      formatSelections,
      id,
    } = testFormatSelections.getSelectionByContentOffset(
      testContent.length,
      3,
      13
    );
    expect(formatSelections.toArrayWithoutIds()).toEqual(
      expectedSelections.toArrayWithoutIds()
    );
    expect(formatSelections.indexOf(id)).toEqual(1);
  });
  test('creates new selection - replaces all selections evenly', () => {
    const expectedSelections = FormatSelections.fromTestArray([
      [
        ,
        SELECTION_ACTION_SITEINFO,
        SELECTION_ACTION_ITALIC,
        SELECTION_ACTION_CODE,
      ],
    ]);
    const {
      formatSelections,
      id,
    } = testFormatSelections.getSelectionByContentOffset(
      testContent.length,
      0,
      30
    );
    expect(formatSelections.toArrayWithoutIds()).toEqual(
      expectedSelections.toArrayWithoutIds()
    );
    expect(formatSelections.indexOf(id)).toEqual(0);
  });
  test('creates new selection - replaces 2nd half of head, 1st half of last selection', () => {
    const expectedSelections = FormatSelections.fromTestArray([
      [2, SELECTION_ACTION_SITEINFO],
      [
        26,
        SELECTION_ACTION_SITEINFO,
        SELECTION_ACTION_ITALIC,
        SELECTION_ACTION_CODE,
      ],
      [],
    ]);
    const {
      formatSelections,
      id,
    } = testFormatSelections.getSelectionByContentOffset(
      testContent.length,
      2,
      28
    );
    expect(formatSelections.toArrayWithoutIds()).toEqual(
      expectedSelections.toArrayWithoutIds()
    );
    expect(formatSelections.indexOf(id)).toEqual(1);
  });
});

describe('replaceSelection', () => {
  test('replaces (updates) a "matched" Selection in the middle', () => {
    // simulates an "update" of an existing selection
    const updatedSelection = testFormatSelections.getAt(2);
    updatedSelection.siteinfo = true;
    const expectedSelections = FormatSelections.fromTestArray([
      [3, SELECTION_ACTION_SITEINFO],
      [3],
      [6, SELECTION_ACTION_ITALIC, SELECTION_ACTION_SITEINFO],
      [1],
      [9, SELECTION_ACTION_CODE],
      [],
    ]);
    testFormatSelections.replaceSelection(updatedSelection);
    expect(testFormatSelections.toArrayWithoutIds()).toEqual(
      expectedSelections.toArrayWithoutIds()
    );
  });
  test('replaces and merges Selections - in the middle', () => {
    const updatedSelection = testFormatSelections.getAt(2);
    updatedSelection.italic = false;
    const expectedSelections = FormatSelections.fromTestArray([
      [3, SELECTION_ACTION_SITEINFO],
      [10],
      [9, SELECTION_ACTION_CODE],
      [],
    ]);
    testFormatSelections.replaceSelection(updatedSelection);
    expect(testFormatSelections.toArrayWithoutIds()).toEqual(
      expectedSelections.toArrayWithoutIds()
    );
  });
  test('replaces a Selection (no merge) - first (head) selection', () => {
    const updatedSelection = testFormatSelections.getAt(0);
    updatedSelection.siteinfo = false;
    updatedSelection.mini = true;
    const expectedSelections = FormatSelections.fromTestArray([
      [3, SELECTION_ACTION_MINI],
      [3],
      [6, SELECTION_ACTION_ITALIC],
      [1],
      [9, SELECTION_ACTION_CODE],
      [],
    ]);
    testFormatSelections.replaceSelection(updatedSelection);
    expect(testFormatSelections.toArrayWithoutIds()).toEqual(
      expectedSelections.toArrayWithoutIds()
    );
  });
  test('replaces and merges Selection - first (head) selection', () => {
    const updatedSelection = testFormatSelections.getAt(0);
    updatedSelection.siteinfo = false;
    const expectedSelections = FormatSelections.fromTestArray([
      [6],
      [6, SELECTION_ACTION_ITALIC],
      [1],
      [9, SELECTION_ACTION_CODE],
      [],
    ]);
    testFormatSelections.replaceSelection(updatedSelection);
    expect(testFormatSelections.toArrayWithoutIds()).toEqual(
      expectedSelections.toArrayWithoutIds()
    );
  });
  test('replaces and merges Selection - last selection', () => {
    const updatedSelection = testFormatSelections.getAt(5);
    updatedSelection.code = true;
    const expectedSelections = FormatSelections.fromTestArray([
      [3, SELECTION_ACTION_SITEINFO],
      [3],
      [6, SELECTION_ACTION_ITALIC],
      [1],
      [, SELECTION_ACTION_CODE],
    ]);
    testFormatSelections.replaceSelection(updatedSelection);
    expect(testFormatSelections.toArrayWithoutIds()).toEqual(
      expectedSelections.toArrayWithoutIds()
    );
  });
  test('replaces and merges Selection - 2nd to last selection', () => {
    const updatedSelection = testFormatSelections.getAt(4);
    updatedSelection.code = false;
    const expectedSelections = FormatSelections.fromTestArray([
      [3, SELECTION_ACTION_SITEINFO],
      [3],
      [6, SELECTION_ACTION_ITALIC],
      [],
    ]);
    testFormatSelections.replaceSelection(updatedSelection);
    expect(testFormatSelections.toArrayWithoutIds()).toEqual(
      expectedSelections.toArrayWithoutIds()
    );
  });
  test('should throw with bad Selection', () => {
    expect(() => {
      testFormatSelections.replaceSelection(new FormatSelectionNode());
    }).toThrow();
  });
});

describe('splitSelectionsAtCaretOffset', () => {
  test('split in middle of selection', () => {
    const expectedSelectionsLeft = FormatSelections.fromTestArray([
      [3, SELECTION_ACTION_SITEINFO],
      [3],
      [6, SELECTION_ACTION_ITALIC],
      [1],
      [, SELECTION_ACTION_CODE],
    ]);
    const expectedSelectionsRight = FormatSelections.fromTestArray([
      [5, SELECTION_ACTION_CODE],
      [],
    ]);
    const { left, right } = testFormatSelections.splitSelectionsAtCaretOffset(
      17
    );
    expect(left.toArrayWithoutIds()).toEqual(
      expectedSelectionsLeft.toArrayWithoutIds()
    );
    expect(right.toArrayWithoutIds()).toEqual(
      expectedSelectionsRight.toArrayWithoutIds()
    );
  });
  test('split at the edge of 2 Selections', () => {
    const expectedSelectionsLeft = FormatSelections.fromTestArray([
      [3, SELECTION_ACTION_SITEINFO],
      [3],
      [6, SELECTION_ACTION_ITALIC],
      [],
    ]);
    const expectedSelectionsRight = FormatSelections.fromTestArray([
      [9, SELECTION_ACTION_CODE],
      [],
    ]);
    const { left, right } = testFormatSelections.splitSelectionsAtCaretOffset(
      13
    );
    expect(left.toArrayWithoutIds()).toEqual(
      expectedSelectionsLeft.toArrayWithoutIds()
    );
    expect(right.toArrayWithoutIds()).toEqual(
      expectedSelectionsRight.toArrayWithoutIds()
    );
  });
  test('split at the edge of last Selection', () => {
    const expectedSelectionsLeft = FormatSelections.fromTestArray([
      [3, SELECTION_ACTION_SITEINFO],
      [3],
      [6, SELECTION_ACTION_ITALIC],
      [1],
      [, SELECTION_ACTION_CODE],
    ]);
    const expectedSelectionsRight = new FormatSelections();
    const { left, right } = testFormatSelections.splitSelectionsAtCaretOffset(
      22
    );
    expect(left.toArrayWithoutIds()).toEqual(
      expectedSelectionsLeft.toArrayWithoutIds()
    );
    expect(right.toArrayWithoutIds()).toEqual(
      expectedSelectionsRight.toArrayWithoutIds()
    );
  });
  test('split in the middle of last "empty" Selection', () => {
    const expectedSelectionsLeft = FormatSelections.fromTestArray([
      [3, SELECTION_ACTION_SITEINFO],
      [3],
      [6, SELECTION_ACTION_ITALIC],
      [1],
      [9, SELECTION_ACTION_CODE],
      [],
    ]);
    const expectedSelectionsRight = new FormatSelections();
    const { left, right } = testFormatSelections.splitSelectionsAtCaretOffset(
      24
    );
    expect(left.toArrayWithoutIds()).toEqual(
      expectedSelectionsLeft.toArrayWithoutIds()
    );
    expect(right.toArrayWithoutIds()).toEqual(
      expectedSelectionsRight.toArrayWithoutIds()
    );
  });
  test('split in the beginning', () => {
    const expectedSelectionsLeft = new FormatSelections();
    const expectedSelectionsRight = FormatSelections.fromTestArray([
      [3, SELECTION_ACTION_SITEINFO],
      [3],
      [6, SELECTION_ACTION_ITALIC],
      [1],
      [9, SELECTION_ACTION_CODE],
      [],
    ]);

    const { left, right } = testFormatSelections.splitSelectionsAtCaretOffset(
      0
    );
    expect(left.toArrayWithoutIds()).toEqual(
      expectedSelectionsLeft.toArrayWithoutIds()
    );
    expect(right.toArrayWithoutIds()).toEqual(
      expectedSelectionsRight.toArrayWithoutIds()
    );
  });
});

describe('concatSelections', () => {
  test('neither left nor right model have selections', () => {
    let left = new FormatSelections();
    let right = new FormatSelections();
    let updated = left.concatSelections(right, testContent.length);
    expect(updated.toArrayWithoutIds()).toEqual(
      new FormatSelections().toArrayWithoutIds()
    );
  });
  test('left last selection has different formats as right first selection (no merge)', () => {
    const leftSelections = FormatSelections.fromTestArray([
      [3, SELECTION_ACTION_SITEINFO],
      [3],
      [6, SELECTION_ACTION_ITALIC],
      [1],
      [9, SELECTION_ACTION_CODE],
      [],
    ]);
    const rightSelections = FormatSelections.fromTestArray([
      [6, SELECTION_ACTION_MINI],
      [6, SELECTION_ACTION_ITALIC],
      [1],
      [9, SELECTION_ACTION_CODE],
      [],
    ]);
    const expectedSelections = FormatSelections.fromTestArray([
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
    const updated = leftSelections.concatSelections(
      rightSelections,
      testContent.length
    );
    expect(updated.toArrayWithoutIds()).toEqual(
      expectedSelections.toArrayWithoutIds()
    );
  });
  test('left last selection has same formats as right first selection (merge)', () => {
    const leftSelections = FormatSelections.fromTestArray([
      [3, SELECTION_ACTION_SITEINFO],
      [3],
      [6, SELECTION_ACTION_ITALIC],
      [1],
      [9, SELECTION_ACTION_CODE],
      [],
    ]);
    const rightSelections = FormatSelections.fromTestArray([
      [6],
      [6, SELECTION_ACTION_ITALIC],
      [1],
      [9, SELECTION_ACTION_CODE],
      [],
    ]);
    const expectedSelections = FormatSelections.fromTestArray([
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
    const updated = leftSelections.concatSelections(
      rightSelections,
      testContent.length
    );
    expect(updated.toArrayWithoutIds()).toEqual(
      expectedSelections.toArrayWithoutIds()
    );
  });
  test('left has no selections, right has selections', () => {
    const leftSelections = new FormatSelections();
    const rightSelections = FormatSelections.fromTestArray([
      [3, SELECTION_ACTION_SITEINFO],
      [3],
      [6, SELECTION_ACTION_ITALIC],
      [1],
      [9, SELECTION_ACTION_CODE],
      [],
    ]);
    const expectedSelections = FormatSelections.fromTestArray([
      [30],
      [3, SELECTION_ACTION_SITEINFO],
      [3],
      [6, SELECTION_ACTION_ITALIC],
      [1],
      [9, SELECTION_ACTION_CODE],
      [],
    ]);
    const updated = leftSelections.concatSelections(
      rightSelections,
      testContent.length
    );
    expect(updated.toArrayWithoutIds()).toEqual(
      expectedSelections.toArrayWithoutIds()
    );
  });
  test('left has selections, right nas no selections', () => {
    const leftSelections = FormatSelections.fromTestArray([
      [3, SELECTION_ACTION_SITEINFO],
      [3],
      [6, SELECTION_ACTION_ITALIC],
      [1],
      [9, SELECTION_ACTION_CODE],
      [],
    ]);
    const rightSelections = new FormatSelections();
    const updated = leftSelections.concatSelections(
      rightSelections,
      testContent.length
    );
    expect(updated.toArrayWithoutIds()).toEqual(
      leftSelections.toArrayWithoutIds()
    );
  });
});

describe('getContentBySelections', () => {
  test('returns an array of content pieces broken out by selection lengths', () => {
    expect(testFormatSelections.getContentBySelections(testContent)).toEqual([
      'And',
      ' a ',
      'second',
      ' ',
      'paragraph',
      ' because',
    ]);
  });
  test('returns an array of one string with all content when no selections', () => {
    const formatSelections = new FormatSelections();
    expect(formatSelections.getContentBySelections(testContent)).toEqual([
      testContent,
    ]);
  });
  test('returns an array of strings with 1 zero-length char for each Selection if content is null or undefined', () => {
    const zeroLengthPlaceholders = Array(6)
      .fill('')
      .map((s) => cleanTextOrZeroLengthPlaceholder(s));
    expect(testFormatSelections.getContentBySelections(null)).toEqual(
      zeroLengthPlaceholders
    );
    expect(testFormatSelections.getContentBySelections(undefined)).toEqual(
      zeroLengthPlaceholders
    );
  });
});

describe.skip('toString', () => {
  test('returns a beautiful human readable output', () => {
    expect(`${testFormatSelections}`).toMatchInlineSnapshot(`
      "FormatSelections
      head: {
        \\"__values\\": {
          \\"length\\": 3,
          \\"selection-siteinfo\\": true
        },
        \\"__id\\": \\"1034\\",
        \\"__next\\": \\"1c15\\"
      }
      {
        \\"__values\\": {
          \\"length\\": 3,
          \\"selection-siteinfo\\": true
        },
        \\"__id\\": \\"1034\\",
        \\"__next\\": \\"1c15\\"
      }
      {
        \\"__values\\": {
          \\"length\\": 6,
          \\"selection-italic\\": true
        },
        \\"__id\\": \\"14bf\\",
        \\"__next\\": \\"2091\\"
      }
      {
        \\"__values\\": {
          \\"length\\": 9,
          \\"selection-code\\": true
        },
        \\"__id\\": \\"9b94\\",
        \\"__next\\": \\"a264\\"
      }
      "
    `);
  });
  test("returns 'empty' for empty selections", () => {
    const empty = new FormatSelections();
    expect(`${empty}`).toMatchInlineSnapshot(`
      "FormatSelections
      empty
      "
    `);
  });
});
