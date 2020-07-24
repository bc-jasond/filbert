const {
  SELECTION_ACTION_BOLD,
  SELECTION_ACTION_CODE,
  SELECTION_ACTION_ITALIC,
  SELECTION_ACTION_LINK,
  SELECTION_ACTION_MINI,
  SELECTION_ACTION_SITEINFO,
  SELECTION_LENGTH,
  SELECTION_LINK_URL,
  SELECTION_NEXT,
} = require('../constants');
const { makeSelections } = require('../test-helpers');

const { fromJS, Map } = require('immutable');
const { reviver, cleanTextOrZeroLengthPlaceholder, Selection } = require('../utils');
const {
  getSelectionAtIdx,
  formatSelections,
  adjustSelectionOffsetsAndCleanup,
  getSelectionByContentOffset,
  replaceSelection,
  splitSelectionsAtCaretOffset,
  concatSelections,
  getContentBySelections,
} = require('../selection-helpers');

const testContent = 'And a second paragraph because';
const testSelections = makeSelections([
  [3, SELECTION_ACTION_SITEINFO],
  [3],
  [6, SELECTION_ACTION_ITALIC],
  [1],
  [9, SELECTION_ACTION_CODE],
  [],
]);
const nodeModelWithSelections = Map({
  type: 'p',
  parent_id: '39fb',
  position: 1,
  content: testContent,
  id: '6eda',
  post_id: 166,
}).setIn(['meta', 'selections'], testSelections);

beforeAll(() => {
  console.debug = () => {};
  console.info = () => {};
  console.log = () => {};
});

describe('selectionReviver', () => {
  test(`return Selection when JS object has '${SELECTION_NEXT}' and '${SELECTION_LENGTH}' keys`, () => {
    expect(
      fromJS({ [SELECTION_NEXT]: undefined, [SELECTION_LENGTH]: -1 }, reviver)
    ).toEqual(Selection());
  });
});

describe('adjustSelectionOffsetsAndCleanup', () => {
  test('delete all highlighted characters up to caret (when "end" in handleBackspace)', () => {
    const expectedSelections = makeSelections([[5, SELECTION_ACTION_CODE], []]);
    const testModel = nodeModelWithSelections.set(
      'content',
      testContent.substring(17)
    );
    const modelAdjusted = adjustSelectionOffsetsAndCleanup(
      testModel,
      testContent,
      17,
      -17
    );
    expect(
      modelAdjusted.getIn(['meta', 'selections']).equals(expectedSelections)
    ).toBe(true);
    expect(modelAdjusted).toMatchSnapshot();
  });
  test('delete all highlighted characters up to caret (up to edge of a selection)', () => {
    const prevContent = 'and some paragraph for good measure?';
    const testModel = nodeModelWithSelections
      .set('content', 'paragraph for good measure?')
      .setIn(
        ['meta', 'selections'],
        makeSelections([
          [9],
          [9, SELECTION_ACTION_CODE],
          [5],
          [4, SELECTION_ACTION_BOLD, SELECTION_ACTION_ITALIC],
          [],
        ])
      );
    const updatedModel = adjustSelectionOffsetsAndCleanup(
      testModel,
      prevContent,
      27,
      -4
    );
    expect(updatedModel).toMatchSnapshot();
  });
  test('delete all highlighted characters from caret through the end (when "start" with multiple nodes in handleBackspace)', () => {
    const expectedSelections = makeSelections([
      [3, SELECTION_ACTION_SITEINFO],
      [3],
      [6, SELECTION_ACTION_ITALIC],
      [1],
      [, SELECTION_ACTION_CODE],
    ]);
    const testModel = nodeModelWithSelections.set(
      'content',
      testContent.substring(0, 17)
    );
    const modelAdjusted = adjustSelectionOffsetsAndCleanup(
      testModel,
      testContent,
      30,
      -13
    );
    expect(
      modelAdjusted.getIn(['meta', 'selections']).equals(expectedSelections)
    ).toBe(true);
    expect(modelAdjusted).toMatchSnapshot();
  });
  test('delete highlighted characters from middle, deletes a selection, adjusts overlapping selections', () => {
    const expectedSelections = makeSelections([
      [3, SELECTION_ACTION_SITEINFO],
      [1],
      [5, SELECTION_ACTION_CODE],
      [],
    ]);
    const testModel = nodeModelWithSelections.set(
      'content',
      `${testContent.substring(0, 4)}${testContent.substring(17)}`
    );
    const modelAdjusted = adjustSelectionOffsetsAndCleanup(
      testModel,
      testContent,
      17,
      -13
    );
    expect(
      modelAdjusted.getIn(['meta', 'selections']).equals(expectedSelections)
    ).toBe(true);
    expect(modelAdjusted).toMatchSnapshot();
  });
  test('delete highlighted characters from one whole selection evenly', () => {
    const expectedSelections = makeSelections([
      [3, SELECTION_ACTION_SITEINFO],
      [4],
      [9, SELECTION_ACTION_CODE],
      [],
    ]);
    const testModel = nodeModelWithSelections.set(
      'content',
      `${testContent.substring(0, 6)}${testContent.substring(12)}`
    );
    const modelAdjusted = adjustSelectionOffsetsAndCleanup(
      testModel,
      testContent,
      12,
      -6
    );
    expect(
      modelAdjusted.getIn(['meta', 'selections']).equals(expectedSelections)
    ).toBe(true);
    expect(modelAdjusted).toMatchSnapshot();
  });
  test('delete highlighted characters from middle of one selection', () => {
    const expectedSelections = makeSelections([
      [3, SELECTION_ACTION_SITEINFO],
      [3],
      [3, SELECTION_ACTION_ITALIC],
      [1],
      [9, SELECTION_ACTION_CODE],
      [],
    ]);
    const testModel = nodeModelWithSelections.set(
      'content',
      `${testContent.substring(0, 8)}${testContent.substring(11)}`
    );
    const modelAdjusted = adjustSelectionOffsetsAndCleanup(
      testModel,
      testContent,
      11,
      -3
    );
    expect(
      modelAdjusted.getIn(['meta', 'selections']).equals(expectedSelections)
    ).toBe(true);
    expect(modelAdjusted).toMatchSnapshot();
  });
  test('delete all characters', () => {
    const modelAdjusted = adjustSelectionOffsetsAndCleanup(
      nodeModelWithSelections.set('content', ''),
      testContent,
      30,
      -30
    );
    expect(
      modelAdjusted.getIn(['meta', 'selections']).equals(Selection())
    ).toBe(true);
    expect(modelAdjusted).toMatchSnapshot();
  });
  test('delete - will merge if neighboring selections have the same formats', () => {
    const expectedSelections = makeSelections([
      [3, SELECTION_ACTION_SITEINFO],
      [3],
      [9, SELECTION_ACTION_CODE],
      [],
    ]);
    const testModel = nodeModelWithSelections.set(
      'content',
      `${testContent.substring(0, 5)}${testContent.substring(12)}`
    );
    const modelAdjusted = adjustSelectionOffsetsAndCleanup(
      testModel,
      testContent,
      12,
      -7
    );
    expect(
      modelAdjusted.getIn(['meta', 'selections']).equals(expectedSelections)
    ).toBe(true);
    expect(modelAdjusted).toMatchSnapshot();
  });
  test('delete - will merge with last selection if same formats', () => {
    const expectedSelections = makeSelections([
      [3, SELECTION_ACTION_SITEINFO],
      [],
    ]);
    const testModel = nodeModelWithSelections.set(
      'content',
      `${testContent.substring(0, 6)}${testContent.substring(23)}`
    );
    const modelAdjusted = adjustSelectionOffsetsAndCleanup(
      testModel,
      testContent,
      23,
      -17
    );
    expect(
      modelAdjusted.getIn(['meta', 'selections']).equals(expectedSelections)
    ).toBe(true);
    expect(modelAdjusted).toMatchSnapshot();
  });
  test('delete one highlighted character at left boundary of two selections', () => {
    const expectedSelections = makeSelections([
      [3, SELECTION_ACTION_SITEINFO],
      [3],
      [5, SELECTION_ACTION_ITALIC],
      [1],
      [9, SELECTION_ACTION_CODE],
      [],
    ]);
    const testModel = nodeModelWithSelections.set(
      'content',
      `${testContent.substring(0, 6)}${testContent.substring(7)}`
    );
    const updatedModel = adjustSelectionOffsetsAndCleanup(
      testModel,
      testContent,
      7,
      -1
    );
    expect(
      updatedModel.getIn(['meta', 'selections']).equals(expectedSelections)
    ).toBe(true);
    expect(updatedModel).toMatchSnapshot();
  });
  test('delete one character at the right boundary of two selections', () => {
    const expectedSelections = makeSelections([
      [3, SELECTION_ACTION_SITEINFO],
      [3],
      [5, SELECTION_ACTION_ITALIC],
      [1],
      [9, SELECTION_ACTION_CODE],
      [],
    ]);
    const testModel = nodeModelWithSelections.set(
      'content',
      `${testContent.substring(0, 11)}${testContent.substring(12)}`
    );
    const updatedModel = adjustSelectionOffsetsAndCleanup(
      testModel,
      testContent,
      12,
      -1
    );
    expect(
      updatedModel.getIn(['meta', 'selections']).equals(expectedSelections)
    ).toBe(true);
    expect(updatedModel).toMatchSnapshot();
  });
  test("delete last character of last selection with formats, model should have 'selections' unset", () => {
    const testModel = nodeModelWithSelections
      .set(
        'content',
        `${testContent.substring(0, 13)}${testContent.substring(14)}`
      )
      .setIn(
        ['meta', 'selections'],
        makeSelections([[13], [1, SELECTION_ACTION_CODE], []])
      );
    const updatedModel = adjustSelectionOffsetsAndCleanup(
      testModel,
      testContent,
      14,
      -1
    );
    expect(updatedModel.getIn(['meta', 'selections'])).toEqual(Selection());
    expect(updatedModel).toMatchSnapshot();
  });
  test('paste a word with collapsed caret (similar to adding one character on keypress)', () => {
    const expectedSelections = makeSelections([
      [3, SELECTION_ACTION_SITEINFO],
      [7],
      [6, SELECTION_ACTION_ITALIC],
      [1],
      [9, SELECTION_ACTION_CODE],
      [],
    ]);
    const testModel = nodeModelWithSelections.set(
      'content',
      `${testContent.substring(0, 5)}pple${testContent.substring(5)}`
    );
    const modelAdjusted = adjustSelectionOffsetsAndCleanup(
      testModel,
      testContent,
      5,
      4
    );
    expect(modelAdjusted.getIn(['meta', 'selections'])).toEqual(
      expectedSelections
    );
  });
  test('paste a word at edge of last selection (noop)', () => {
    const expectedSelections = makeSelections([
      [3, SELECTION_ACTION_SITEINFO],
      [3],
      [6, SELECTION_ACTION_ITALIC],
      [1],
      [9, SELECTION_ACTION_CODE],
      [],
    ]);
    const testModel = nodeModelWithSelections.set(
      'content',
      `${testContent.substring(0, 22)} just${testContent.substring(22)}`
    );
    const modelAdjusted = adjustSelectionOffsetsAndCleanup(
      testModel,
      testContent,
      22,
      5
    );
    expect(modelAdjusted.getIn(['meta', 'selections'])).toEqual(
      expectedSelections
    );
  });
  test('add a letter to the end of content (noop)', () => {
    const expectedSelections = makeSelections([
      [3, SELECTION_ACTION_SITEINFO],
      [3],
      [6, SELECTION_ACTION_ITALIC],
      [1],
      [9, SELECTION_ACTION_CODE],
      [],
    ]);
    const testModel = nodeModelWithSelections.set('content', `${testContent}X`);
    const modelAdjusted = adjustSelectionOffsetsAndCleanup(
      testModel,
      testContent,
      30,
      1
    );
    expect(modelAdjusted.getIn(['meta', 'selections'])).toEqual(
      expectedSelections
    );
  });
  test('noop - default arguments', () => {
    const testModel = nodeModelWithSelections.set('content', testContent);
    const modelAdjusted = adjustSelectionOffsetsAndCleanup(testModel);
    expect(
      modelAdjusted
        .getIn(['meta', 'selections'])
        .equals(testModel.getIn(['meta', 'selections']))
    ).toBe(true);
    expect(modelAdjusted).toMatchSnapshot();
  });
  test('add a word to the end of content with 1 selection (noop)', () => {
    const expectedSelections = makeSelections([[, SELECTION_ACTION_SITEINFO]]);
    const testModel = nodeModelWithSelections
      .setIn(['meta', 'selections'], expectedSelections)
      .set('content', `${testContent}Slappy`);
    const modelAdjusted = adjustSelectionOffsetsAndCleanup(
      testModel,
      testContent,
      30,
      6
    );
    expect(modelAdjusted.getIn(['meta', 'selections'])).toEqual(
      expectedSelections
    );
  });
  test('start or end out of bounds should throw', () => {
    expect(() => {
      adjustSelectionOffsetsAndCleanup(
        nodeModelWithSelections,
        testContent,
        -1,
        10
      );
    }).toThrow();
    expect(() => {
      adjustSelectionOffsetsAndCleanup(
        nodeModelWithSelections,
        testContent,
        25,
        10
      );
    }).toThrow();
    expect(() => {
      adjustSelectionOffsetsAndCleanup(
        nodeModelWithSelections,
        testContent,
        31,
        -12
      );
    }).toThrow();
    expect(() => {
      adjustSelectionOffsetsAndCleanup(
        nodeModelWithSelections,
        testContent,
        12,
        -15
      );
    }).toThrow();
  });
});

describe('getSelectionByContentOffset', () => {
  test('finds existing selection, preserves existing formats', () => {
    const expectedSelections = makeSelections([
      [3, SELECTION_ACTION_SITEINFO],
      [3],
      [6, SELECTION_ACTION_ITALIC],
      [1],
      [
        9,
        SELECTION_ACTION_LINK,
        { key: SELECTION_LINK_URL, value: 'http://foo.bar' },
      ],
      [],
    ]);
    const testModel = nodeModelWithSelections.setIn(
      ['meta', 'selections'],
      expectedSelections
    );
    const { selections, idx } = getSelectionByContentOffset(testModel, 13, 22);
    expect(selections).toEqual(expectedSelections);
    expect(idx).toEqual(4);
  });
  test('finds existing selection, last selection', () => {
    const expectedSelections = makeSelections([
      [3, SELECTION_ACTION_SITEINFO],
      [3],
      [6, SELECTION_ACTION_ITALIC],
      [1],
      [
        9,
        SELECTION_ACTION_LINK,
        { key: SELECTION_LINK_URL, value: 'http://foo.bar' },
      ],
      [],
    ]);
    const testModel = nodeModelWithSelections.setIn(
      ['meta', 'selections'],
      expectedSelections
    );
    const { selections, idx } = getSelectionByContentOffset(testModel, 22, 30);
    expect(selections).toEqual(expectedSelections);
    expect(idx).toEqual(5);
  });
  test('creates new selection - somewhere in the middle, replacing other selections', () => {
    const expectedSelections = makeSelections([
      [3, SELECTION_ACTION_SITEINFO],
      [2],
      [11, SELECTION_ACTION_ITALIC, SELECTION_ACTION_CODE],
      [6, SELECTION_ACTION_CODE],
      [],
    ]);
    const { selections, idx } = getSelectionByContentOffset(
      nodeModelWithSelections,
      5,
      16
    );
    expect(selections).toEqual(expectedSelections);
    expect(idx).toEqual(2);
  });
  test('creates new selection - replaces first (head) selection', () => {
    const expectedSelections = makeSelections([
      [8, SELECTION_ACTION_SITEINFO, SELECTION_ACTION_ITALIC],
      [4, SELECTION_ACTION_ITALIC],
      [1],
      [9, SELECTION_ACTION_CODE],
      [],
    ]);
    const { selections, idx } = getSelectionByContentOffset(
      nodeModelWithSelections,
      0,
      8
    );
    expect(selections).toEqual(expectedSelections);
    expect(idx).toEqual(0);
  });
  test('creates new selection - replaces part of first (head) selection', () => {
    const expectedSelections = makeSelections([
      [1, SELECTION_ACTION_SITEINFO],
      [2, SELECTION_ACTION_SITEINFO],
      [3],
      [6, SELECTION_ACTION_ITALIC],
      [1],
      [9, SELECTION_ACTION_CODE],
      [],
    ]);
    const { selections, idx } = getSelectionByContentOffset(
      nodeModelWithSelections,
      0,
      1
    );
    expect(selections).toEqual(expectedSelections);
    expect(idx).toEqual(0);
  });
  test('creates new selection - replaces first (head) selection - empty selections', () => {
    const expectedSelections = makeSelections([[8], []]);
    const { selections, idx } = getSelectionByContentOffset(
      nodeModelWithSelections.set('meta', Map()),
      0,
      8
    );
    expect(selections).toEqual(expectedSelections);
    expect(idx).toEqual(0);
  });
  test('creates new selection - middle through replaces last selection', () => {
    const expectedSelections = makeSelections([
      [3, SELECTION_ACTION_SITEINFO],
      [3],
      [6, SELECTION_ACTION_ITALIC],
      [-1, SELECTION_ACTION_CODE],
    ]);
    const { selections, idx } = getSelectionByContentOffset(
      nodeModelWithSelections,
      12,
      30
    );
    expect(selections).toEqual(expectedSelections);
    expect(idx).toEqual(3);
  });
  test('creates new selection - replaces 2nd half of last selection', () => {
    const expectedSelections = makeSelections([
      [3, SELECTION_ACTION_SITEINFO],
      [3],
      [6, SELECTION_ACTION_ITALIC],
      [1],
      [9, SELECTION_ACTION_CODE],
      [3],
      [],
    ]);
    const { selections, idx } = getSelectionByContentOffset(
      nodeModelWithSelections,
      25,
      30
    );
    expect(selections).toEqual(expectedSelections);
    expect(idx).toEqual(6);
  });
  test('creates new selection - replaces up to last selection', () => {
    const expectedSelections = makeSelections([
      [3, SELECTION_ACTION_SITEINFO],
      [3],
      [6, SELECTION_ACTION_ITALIC],
      [16, SELECTION_ACTION_CODE],
      [],
    ]);
    const { selections, idx } = getSelectionByContentOffset(
      nodeModelWithSelections,
      12,
      28
    );
    expect(selections).toEqual(expectedSelections);
    expect(idx).toEqual(3);
  });
  test('creates new selection - completely within existing selection', () => {
    const expectedSelections = makeSelections([
      [3, SELECTION_ACTION_SITEINFO],
      [3],
      [6, SELECTION_ACTION_ITALIC],
      [1],
      [3, SELECTION_ACTION_CODE],
      [3, SELECTION_ACTION_CODE],
      [3, SELECTION_ACTION_CODE],
      [],
    ]);
    const { selections, idx } = getSelectionByContentOffset(
      nodeModelWithSelections,
      16,
      19
    );
    expect(selections).toEqual(expectedSelections);
    expect(idx).toEqual(5);
  });
  test('creates new selection - completely within last selection', () => {
    const expectedSelections = makeSelections([
      [3, SELECTION_ACTION_SITEINFO],
      [3],
      [6, SELECTION_ACTION_ITALIC],
      [1],
      [9, SELECTION_ACTION_CODE],
      [3],
      [3],
      [],
    ]);
    const { selections, idx } = getSelectionByContentOffset(
      nodeModelWithSelections,
      25,
      28
    );
    expect(selections).toEqual(expectedSelections);
    expect(idx).toEqual(6);
  });
  test('creates new selection - replaces more than one selection evenly', () => {
    const expectedSelections = makeSelections([
      [3, SELECTION_ACTION_SITEINFO],
      [10, SELECTION_ACTION_ITALIC],
      [9, SELECTION_ACTION_CODE],
      [],
    ]);
    const { selections, idx } = getSelectionByContentOffset(
      nodeModelWithSelections,
      3,
      13
    );
    expect(selections).toEqual(expectedSelections);
    expect(idx).toEqual(1);
  });
  test('creates new selection - replaces all selections evenly', () => {
    const expectedSelections = makeSelections([
      [
        ,
        SELECTION_ACTION_SITEINFO,
        SELECTION_ACTION_ITALIC,
        SELECTION_ACTION_CODE,
      ],
    ]);
    const { selections, idx } = getSelectionByContentOffset(
      nodeModelWithSelections,
      0,
      30
    );
    expect(selections).toEqual(expectedSelections);
    expect(idx).toEqual(0);
  });
  test('creates new selection - replaces 2nd half of head, 1st half of last selection', () => {
    const expectedSelections = makeSelections([
      [2, SELECTION_ACTION_SITEINFO],
      [
        26,
        SELECTION_ACTION_SITEINFO,
        SELECTION_ACTION_ITALIC,
        SELECTION_ACTION_CODE,
      ],
      [],
    ]);
    const { selections, idx } = getSelectionByContentOffset(
      nodeModelWithSelections,
      2,
      28
    );
    expect(selections).toEqual(expectedSelections);
    expect(idx).toEqual(1);
  });
});

describe('replaceSelection', () => {
  test('replaces (updates) a "matched" Selection in the middle', () => {
    // simulates an "update" of an existing selection
    const newSelection = Selection({
      [SELECTION_LENGTH]: 6,
      [SELECTION_ACTION_ITALIC]: true,
      [SELECTION_ACTION_SITEINFO]: true,
    });
    const expectedSelections = makeSelections([
      [3, SELECTION_ACTION_SITEINFO],
      [3],
      [6, SELECTION_ACTION_ITALIC, SELECTION_ACTION_SITEINFO],
      [1],
      [9, SELECTION_ACTION_CODE],
      [],
    ]);
    const updatedModel = replaceSelection(
      nodeModelWithSelections,
      newSelection,
      2
    );
    expect(updatedModel.getIn(['meta', 'selections'])).toEqual(
      expectedSelections
    );
  });
  test('replaces and merges Selections - in the middle', () => {
    const newSelection = Selection({
      [SELECTION_LENGTH]: 6,
    });
    const expectedSelections = makeSelections([
      [3, SELECTION_ACTION_SITEINFO],
      [10],
      [9, SELECTION_ACTION_CODE],
      [],
    ]);
    const updatedModel = replaceSelection(
      nodeModelWithSelections,
      newSelection,
      2
    );
    expect(updatedModel.getIn(['meta', 'selections'])).toEqual(
      expectedSelections
    );
  });
  test('replaces a Selection (no merge) - first (head) selection', () => {
    const newSelection = Selection({
      [SELECTION_LENGTH]: 3,
      [SELECTION_ACTION_MINI]: true,
    });
    const expectedSelections = makeSelections([
      [3, SELECTION_ACTION_MINI],
      [3],
      [6, SELECTION_ACTION_ITALIC],
      [1],
      [9, SELECTION_ACTION_CODE],
      [],
    ]);
    const updatedModel = replaceSelection(
      nodeModelWithSelections,
      newSelection,
      0
    );
    expect(updatedModel.getIn(['meta', 'selections'])).toEqual(
      expectedSelections
    );
  });
  test('replaces and merges Selection - first (head) selection', () => {
    const newSelection = Selection({
      [SELECTION_LENGTH]: 3,
    });
    const expectedSelections = makeSelections([
      [6],
      [6, SELECTION_ACTION_ITALIC],
      [1],
      [9, SELECTION_ACTION_CODE],
      [],
    ]);
    const updatedModel = replaceSelection(
      nodeModelWithSelections,
      newSelection,
      0
    );
    expect(updatedModel.getIn(['meta', 'selections'])).toEqual(
      expectedSelections
    );
  });
  test('replaces and merges Selection - last selection', () => {
    const newSelection = Selection({
      [SELECTION_ACTION_CODE]: true,
    });
    const expectedSelections = makeSelections([
      [3, SELECTION_ACTION_SITEINFO],
      [3],
      [6, SELECTION_ACTION_ITALIC],
      [1],
      [, SELECTION_ACTION_CODE],
    ]);
    const updatedModel = replaceSelection(
      nodeModelWithSelections,
      newSelection,
      5
    );
    expect(updatedModel.getIn(['meta', 'selections'])).toEqual(
      expectedSelections
    );
  });
  test('replaces and merges Selection - 2nd to last selection', () => {
    const newSelection = Selection({
      [SELECTION_LENGTH]: 9,
    });
    const expectedSelections = makeSelections([
      [3, SELECTION_ACTION_SITEINFO],
      [3],
      [6, SELECTION_ACTION_ITALIC],
      [],
    ]);
    const updatedModel = replaceSelection(
      nodeModelWithSelections,
      newSelection,
      4
    );
    expect(updatedModel.getIn(['meta', 'selections'])).toEqual(
      expectedSelections
    );
  });
  test('should throw with bad idx', () => {
    expect(() => {
      replaceSelection(nodeModelWithSelections, Selection(), 100);
    }).toThrow();
  });
});

describe('getSelectionAtIdx', () => {
  test('gets the right selection', () => {
    const expectedSelections = makeSelections([[9, SELECTION_ACTION_CODE], []]);
    const actualSelections = getSelectionAtIdx(testSelections, 4);
    expect(actualSelections).toEqual(expectedSelections);
  });
  test('should throw on bad idx', () => {
    expect(() => {
      getSelectionAtIdx(testSelections, 100);
    }).toThrow();
  });
});

describe('splitSelectionsAtCaretOffset', () => {
  test('split in middle of selection', () => {
    const expectedSelectionsLeft = makeSelections([
      [3, SELECTION_ACTION_SITEINFO],
      [3],
      [6, SELECTION_ACTION_ITALIC],
      [1],
      [, SELECTION_ACTION_CODE],
    ]);
    const expectedSelectionsRight = makeSelections([
      [5, SELECTION_ACTION_CODE],
      [],
    ]);
    const leftModel = nodeModelWithSelections.set(
      'content',
      testContent.substring(0, 17)
    );
    const rightModel = nodeModelWithSelections.set(
      'content',
      testContent.substring(17)
    );
    const { leftNode, rightNode } = splitSelectionsAtCaretOffset(
      leftModel,
      rightModel,
      17
    );
    expect(leftNode.getIn(['meta', 'selections'])).toEqual(
      expectedSelectionsLeft
    );
    expect(rightNode.getIn(['meta', 'selections'])).toEqual(
      expectedSelectionsRight
    );
  });
  test('split at the edge of 2 Selections', () => {
    const expectedSelectionsLeft = makeSelections([
      [3, SELECTION_ACTION_SITEINFO],
      [3],
      [6, SELECTION_ACTION_ITALIC],
      [],
    ]);
    const expectedSelectionsRight = makeSelections([
      [9, SELECTION_ACTION_CODE],
      [],
    ]);
    const leftModel = nodeModelWithSelections.set(
      'content',
      testContent.substring(0, 13)
    );
    const rightModel = nodeModelWithSelections.set(
      'content',
      testContent.substring(13)
    );
    const { leftNode, rightNode } = splitSelectionsAtCaretOffset(
      leftModel,
      rightModel,
      13
    );
    expect(leftNode.getIn(['meta', 'selections'])).toEqual(
      expectedSelectionsLeft
    );
    expect(rightNode.getIn(['meta', 'selections'])).toEqual(
      expectedSelectionsRight
    );
  });
  test('split at the edge of last Selection', () => {
    const expectedSelectionsLeft = makeSelections([
      [3, SELECTION_ACTION_SITEINFO],
      [3],
      [6, SELECTION_ACTION_ITALIC],
      [1],
      [, SELECTION_ACTION_CODE],
    ]);
    const leftModel = nodeModelWithSelections.set(
      'content',
      testContent.substring(0, 22)
    );
    const rightModel = nodeModelWithSelections.set(
      'content',
      testContent.substring(22)
    );
    const { leftNode, rightNode } = splitSelectionsAtCaretOffset(
      leftModel,
      rightModel,
      22
    );
    expect(leftNode.getIn(['meta', 'selections'])).toEqual(
      expectedSelectionsLeft
    );
    expect(rightNode.getIn(['meta', 'selections'])).toEqual(Selection());
  });
  test('split in the middle of last Selection', () => {
    const expectedSelectionsLeft = makeSelections([
      [3, SELECTION_ACTION_SITEINFO],
      [3],
      [6, SELECTION_ACTION_ITALIC],
      [1],
      [9, SELECTION_ACTION_CODE],
      [],
    ]);
    const leftModel = nodeModelWithSelections.set(
      'content',
      testContent.substring(0, 24)
    );
    const rightModel = nodeModelWithSelections.set(
      'content',
      testContent.substring(24)
    );
    const { leftNode, rightNode } = splitSelectionsAtCaretOffset(
      leftModel,
      rightModel,
      24
    );
    expect(leftNode.getIn(['meta', 'selections'])).toEqual(
      expectedSelectionsLeft
    );
    expect(rightNode.getIn(['meta', 'selections'])).toEqual(Selection());
  });
  test('split in the beginning', () => {
    const expectedSelectionsLeft = makeSelections([
      // NOTE: this is kind of strange but, it makes sense.  splitSelectionsAtCaretOffset() won't be called this way
      // but, if it were to be... then this should be the expected behavior instead of the default Selection()
      [, SELECTION_ACTION_SITEINFO],
    ]);
    const expectedSelectionsRight = makeSelections([
      [3, SELECTION_ACTION_SITEINFO],
      [3],
      [6, SELECTION_ACTION_ITALIC],
      [1],
      [9, SELECTION_ACTION_CODE],
      [],
    ]);
    const leftModel = nodeModelWithSelections.set('content', '');
    const rightModel = nodeModelWithSelections.set('content', testContent);
    const { leftNode, rightNode } = splitSelectionsAtCaretOffset(
      leftModel,
      rightModel,
      0
    );
    expect(leftNode.getIn(['meta', 'selections'])).toEqual(
      expectedSelectionsLeft
    );
    expect(rightNode.getIn(['meta', 'selections'])).toEqual(
      expectedSelectionsRight
    );
  });
});

describe('concatSelections', () => {
  test('neither left nor right model have selections', () => {
    let leftModel = nodeModelWithSelections.deleteIn(['meta', 'selections']);
    let rightModel = nodeModelWithSelections.deleteIn(['meta', 'selections']);
    let updatedModel = concatSelections(leftModel, rightModel);
    expect(updatedModel.getIn(['meta', 'selections'])).toEqual(Selection());
    leftModel = leftModel.setIn(['meta', 'selections'], Selection());
    rightModel = rightModel.setIn(['meta', 'selections'], Selection());
    updatedModel = concatSelections(leftModel, rightModel);
    expect(updatedModel.getIn(['meta', 'selections'])).toEqual(Selection());
  });
  test('left last selection has same formats as right first selection (merge)', () => {
    const leftSelections = makeSelections([
      [3, SELECTION_ACTION_SITEINFO],
      [3],
      [6, SELECTION_ACTION_ITALIC],
      [1],
      [9, SELECTION_ACTION_CODE],
      [],
    ]);
    const rightSelections = makeSelections([
      [6],
      [6, SELECTION_ACTION_ITALIC],
      [1],
      [9, SELECTION_ACTION_CODE],
      [],
    ]);
    const expectedSelections = makeSelections([
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
    const leftModel = nodeModelWithSelections.setIn(
      ['meta', 'selections'],
      leftSelections
    );
    const rightModel = nodeModelWithSelections.setIn(
      ['meta', 'selections'],
      rightSelections
    );
    const updatedModel = concatSelections(leftModel, rightModel);
    expect(updatedModel.getIn(['meta', 'selections'])).toEqual(
      expectedSelections
    );
  });
  test('left has no selections, right has selections', () => {
    const rightSelections = makeSelections([
      [3, SELECTION_ACTION_SITEINFO],
      [3],
      [6, SELECTION_ACTION_ITALIC],
      [1],
      [9, SELECTION_ACTION_CODE],
      [],
    ]);
    const expectedSelections = makeSelections([
      [30],
      [3, SELECTION_ACTION_SITEINFO],
      [3],
      [6, SELECTION_ACTION_ITALIC],
      [1],
      [9, SELECTION_ACTION_CODE],
      [],
    ]);
    const leftModel = nodeModelWithSelections.deleteIn(['meta', 'selections']);
    const rightModel = nodeModelWithSelections.setIn(
      ['meta', 'selections'],
      rightSelections
    );
    const updatedModel = concatSelections(leftModel, rightModel);
    expect(updatedModel.getIn(['meta', 'selections'])).toEqual(
      expectedSelections
    );
  });
  test('left has selections, right nas no selections', () => {
    const leftSelections = makeSelections([
      [3, SELECTION_ACTION_SITEINFO],
      [3],
      [6, SELECTION_ACTION_ITALIC],
      [1],
      [9, SELECTION_ACTION_CODE],
      [],
    ]);
    const leftModel = nodeModelWithSelections.setIn(
      ['meta', 'selections'],
      leftSelections
    );
    const rightModel = nodeModelWithSelections.setIn(
      ['meta', 'selections'],
      Selection()
    );
    const updatedModel = concatSelections(leftModel, rightModel);
    expect(updatedModel.getIn(['meta', 'selections'])).toEqual(leftSelections);
  });
});

describe('getContentBySelections', () => {
  test('returns an array of content pieces broken out by selection lengths', () => {
    expect(getContentBySelections(nodeModelWithSelections)).toEqual([
      'And',
      ' a ',
      'second',
      ' ',
      'paragraph',
      ' because',
    ]);
  });
  test('returns an array of one string with all content when no selections', () => {
    let testModel = nodeModelWithSelections.deleteIn(['meta', 'selections']);
    expect(getContentBySelections(testModel)).toEqual([testContent]);
  });
  test('returns an array of one string with all content when one default selection', () => {
    let testModel = nodeModelWithSelections.setIn(
      ['meta', 'selections'],
      Selection()
    );
    expect(getContentBySelections(testModel)).toEqual([testContent]);
  });
  test('returns an array of strings with 1 zero-length char for each Selection if content is null or undefined', () => {
    const zeroLengthPlaceholders = Array(6)
      .fill('')
      .map((s) => cleanTextOrZeroLengthPlaceholder(s));
    expect(
      getContentBySelections(nodeModelWithSelections.set('content', null))
    ).toEqual(zeroLengthPlaceholders);
    expect(
      getContentBySelections(nodeModelWithSelections.set('content', undefined))
    ).toEqual(zeroLengthPlaceholders);
  });
});

describe('formatSelections', () => {
  test("return empty string if argument isn't a List()", () => {
    expect(formatSelections([])).toBe('');
    expect(formatSelections({})).toBe('');
    expect(formatSelections(null)).toBe('');
  });
});
