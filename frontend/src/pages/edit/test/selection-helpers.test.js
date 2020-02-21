import {
  SELECTION_ACTION_BOLD,
  SELECTION_ACTION_CODE,
  SELECTION_ACTION_ITALIC,
  SELECTION_ACTION_LINK,
  SELECTION_ACTION_SITEINFO,
  SELECTION_LINK_URL,
  SELECTION_LENGTH,
  SELECTION_NEXT
} from '../../../common/constants';

const { fromJS } = require('immutable');
const { reviver } = require('../document-model');
const {
  Selection,
  formatSelections,
  adjustSelectionOffsetsAndCleanup,
  getSelection,
  upsertSelection,
  splitSelectionsAtCaretOffset,
  concatSelections,
  getContentBySelections
} = require('../selection-helpers');

const testContent = 'And a second paragraph because';
const nodeModelWithSelections = fromJS(
  {
    type: 'p',
    parent_id: '39fb',
    position: 1,
    content: testContent,
    meta: {
      selections: {
        [SELECTION_ACTION_SITEINFO]: true,
        [SELECTION_LENGTH]: 3,
        [SELECTION_NEXT]: {
          [SELECTION_LENGTH]: 3,
          [SELECTION_NEXT]: {
            [SELECTION_ACTION_ITALIC]: true,
            [SELECTION_LENGTH]: 6,
            [SELECTION_NEXT]: {
              [SELECTION_LENGTH]: 1,
              [SELECTION_NEXT]: {
                [SELECTION_ACTION_CODE]: true,
                [SELECTION_LENGTH]: 9,
                [SELECTION_NEXT]: {
                  [SELECTION_LENGTH]: -1,
                  [SELECTION_NEXT]: undefined
                }
              }
            }
          }
        }
      }
    },
    id: '6eda',
    post_id: 166
  },
  reviver
);

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
    const expectedSelections = fromJS(
      {
        [SELECTION_ACTION_CODE]: true,
        [SELECTION_LENGTH]: 5,
        [SELECTION_NEXT]: {
          [SELECTION_LENGTH]: -1,
          [SELECTION_NEXT]: undefined
        }
      },
      reviver
    );

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
    const testModel = fromJS(
      {
        type: 'p',
        parent_id: '39fb',
        position: 1,
        content: 'paragraph for good measure?',
        meta: {
          selections: {
            [SELECTION_LENGTH]: 9,
            [SELECTION_NEXT]: {
              [SELECTION_ACTION_CODE]: true,
              [SELECTION_LENGTH]: 9,
              [SELECTION_NEXT]: {
                [SELECTION_LENGTH]: 5,
                [SELECTION_NEXT]: {
                  'selection-bold': true,
                  [SELECTION_ACTION_ITALIC]: true,
                  [SELECTION_LENGTH]: 4,
                  [SELECTION_NEXT]: {
                    [SELECTION_LENGTH]: -1,
                    [SELECTION_NEXT]: undefined
                  }
                }
              }
            }
          }
        },
        id: 'ce7b',
        post_id: 166
      },
      reviver
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
    const expectedSelections = fromJS(
      {
        [SELECTION_ACTION_SITEINFO]: true,
        [SELECTION_LENGTH]: 3,
        [SELECTION_NEXT]: {
          [SELECTION_LENGTH]: 3,
          [SELECTION_NEXT]: {
            [SELECTION_ACTION_ITALIC]: true,
            [SELECTION_LENGTH]: 6,
            [SELECTION_NEXT]: {
              [SELECTION_LENGTH]: 1,
              [SELECTION_NEXT]: {
                [SELECTION_ACTION_CODE]: true,
                [SELECTION_LENGTH]: -1,
                [SELECTION_NEXT]: undefined
              }
            }
          }
        }
      },
      reviver
    );

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
    const expectedSelections = fromJS(
      {
        [SELECTION_ACTION_SITEINFO]: true,
        [SELECTION_LENGTH]: 3,
        [SELECTION_NEXT]: {
          [SELECTION_LENGTH]: 1,
          [SELECTION_NEXT]: {
            [SELECTION_ACTION_CODE]: true,
            [SELECTION_LENGTH]: 5,
            [SELECTION_NEXT]: {
              [SELECTION_LENGTH]: -1,
              [SELECTION_NEXT]: undefined
            }
          }
        }
      },
      reviver
    );
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
  test('delete highlighted characters from middle of one selection', () => {
    const expectedSelections = fromJS(
      {
        [SELECTION_ACTION_SITEINFO]: true,
        [SELECTION_LENGTH]: 3,
        [SELECTION_NEXT]: {
          [SELECTION_LENGTH]: 3,
          [SELECTION_NEXT]: {
            [SELECTION_ACTION_ITALIC]: true,
            [SELECTION_LENGTH]: 3,
            [SELECTION_NEXT]: {
              [SELECTION_LENGTH]: 1,
              [SELECTION_NEXT]: {
                [SELECTION_ACTION_CODE]: true,
                [SELECTION_LENGTH]: 9,
                [SELECTION_NEXT]: {
                  [SELECTION_LENGTH]: -1,
                  [SELECTION_NEXT]: undefined
                }
              }
            }
          }
        }
      },
      reviver
    );
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
  test('delete - will merge if neighboring selections have the same formats', () => {
    const expectedSelections = fromJS(
      {
        [SELECTION_ACTION_SITEINFO]: true,
        [SELECTION_LENGTH]: 3,
        [SELECTION_NEXT]: {
          [SELECTION_LENGTH]: 3,
          [SELECTION_NEXT]: {
            [SELECTION_ACTION_CODE]: true,
            [SELECTION_LENGTH]: 9,
            [SELECTION_NEXT]: {
              [SELECTION_LENGTH]: -1,
              [SELECTION_NEXT]: undefined
            }
          }
        }
      },
      reviver
    );
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
    const expectedSelections = fromJS(
      {
        [SELECTION_ACTION_SITEINFO]: true,
        [SELECTION_LENGTH]: 3,
        [SELECTION_NEXT]: {
          [SELECTION_LENGTH]: -1,
          [SELECTION_NEXT]: undefined
        }
      },
      reviver
    );
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
  test('paste a word with collapsed caret (similar to adding one character on keypress)', () => {
    const expectedSelections = fromJS(
      {
        [SELECTION_ACTION_SITEINFO]: true,
        [SELECTION_LENGTH]: 3,
        [SELECTION_NEXT]: {
          [SELECTION_LENGTH]: 7,
          [SELECTION_NEXT]: {
            [SELECTION_ACTION_ITALIC]: true,
            [SELECTION_LENGTH]: 6,
            [SELECTION_NEXT]: {
              [SELECTION_LENGTH]: 1,
              [SELECTION_NEXT]: {
                [SELECTION_ACTION_CODE]: true,
                [SELECTION_LENGTH]: 9,
                [SELECTION_NEXT]: {
                  [SELECTION_LENGTH]: -1,
                  [SELECTION_NEXT]: undefined
                }
              }
            }
          }
        }
      },
      reviver
    );
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
    expect(
      modelAdjusted.getIn(['meta', 'selections']).equals(expectedSelections)
    ).toBe(true);
    expect(modelAdjusted).toMatchSnapshot();
  });
  test('delete one highlighted character at left boundary of two selections', () => {
    const expectedSelections = fromJS(
      {
        [SELECTION_ACTION_SITEINFO]: true,
        [SELECTION_LENGTH]: 3,
        [SELECTION_NEXT]: {
          [SELECTION_LENGTH]: 3,
          [SELECTION_NEXT]: {
            [SELECTION_ACTION_ITALIC]: true,
            [SELECTION_LENGTH]: 5,
            [SELECTION_NEXT]: {
              [SELECTION_LENGTH]: 1,
              [SELECTION_NEXT]: {
                [SELECTION_ACTION_CODE]: true,
                [SELECTION_LENGTH]: 9,
                [SELECTION_NEXT]: {
                  [SELECTION_LENGTH]: -1,
                  [SELECTION_NEXT]: undefined
                }
              }
            }
          }
        }
      },
      reviver
    );
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
    const expectedSelections = fromJS(
      {
        [SELECTION_ACTION_SITEINFO]: true,
        [SELECTION_LENGTH]: 3,
        [SELECTION_NEXT]: {
          [SELECTION_LENGTH]: 3,
          [SELECTION_NEXT]: {
            [SELECTION_ACTION_ITALIC]: true,
            [SELECTION_LENGTH]: 5,
            [SELECTION_NEXT]: {
              [SELECTION_LENGTH]: 1,
              [SELECTION_NEXT]: {
                [SELECTION_ACTION_CODE]: true,
                [SELECTION_LENGTH]: 9,
                [SELECTION_NEXT]: {
                  [SELECTION_LENGTH]: -1,
                  [SELECTION_NEXT]: undefined
                }
              }
            }
          }
        }
      },
      reviver
    );
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
        fromJS(
          {
            [SELECTION_LENGTH]: 13,
            [SELECTION_NEXT]: {
              [SELECTION_ACTION_CODE]: true,
              [SELECTION_LENGTH]: 1,
              [SELECTION_NEXT]: {
                [SELECTION_LENGTH]: -1,
                [SELECTION_NEXT]: undefined
              }
            }
          },
          reviver
        )
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

describe('getSelection', () => {
  test('finds existing Selection, preserves existing formats', () => {
    const expectedSelections = fromJS(
      {
        [SELECTION_ACTION_SITEINFO]: true,
        [SELECTION_LENGTH]: 3,
        [SELECTION_NEXT]: {
          [SELECTION_LENGTH]: 3,
          [SELECTION_NEXT]: {
            [SELECTION_ACTION_ITALIC]: true,
            [SELECTION_LENGTH]: 6,
            [SELECTION_NEXT]: {
              [SELECTION_LENGTH]: 1,
              [SELECTION_NEXT]: {
                [SELECTION_ACTION_LINK]: true,
                [SELECTION_LINK_URL]: 'http://foo.bar',
                [SELECTION_LENGTH]: 9,
                [SELECTION_NEXT]: {
                  [SELECTION_LENGTH]: -1,
                  [SELECTION_NEXT]: undefined
                }
              }
            }
          }
        }
      },
      reviver
    );
    const testModel = nodeModelWithSelections.setIn(
      ['meta', 'selections'],
      expectedSelections
    );
    const { selections, idx } = getSelection(testModel, 13, 22);
    expect(selections).toEqual(expectedSelections);
    expect(idx).toEqual(4);
  });
  test('creates new selection somewhere in the middle, replacing other selections', () => {
    const expectedSelections = fromJS(
      {
        [SELECTION_ACTION_SITEINFO]: true,
        [SELECTION_LENGTH]: 3,
        [SELECTION_NEXT]: {
          [SELECTION_LENGTH]: 13,
          [SELECTION_NEXT]: {
            [SELECTION_ACTION_CODE]: true,
            [SELECTION_LENGTH]: 6,
            [SELECTION_NEXT]: {
              [SELECTION_LENGTH]: -1,
              [SELECTION_NEXT]: undefined
            }
          }
        }
      },
      reviver
    );
    const { selections, idx } = getSelection(nodeModelWithSelections, 5, 16);
    expect(selections).toEqual(expectedSelections);
    expect(idx).toEqual(1);
  });
  test.todo('creates new selection - replaces first (head) selection');
  test.todo('creates new selection - replaces last selection');
  test.todo('creates new selection - merges with first');
  test('creates new selection - merges with first and last selection to become default selection', () => {
    const testSelections = fromJS(
      {
        [SELECTION_LENGTH]: 10,
        [SELECTION_NEXT]: {
          [SELECTION_ACTION_CODE]: true,
          [SELECTION_LENGTH]: 10,
          [SELECTION_NEXT]: {
            [SELECTION_LENGTH]: -1,
            [SELECTION_NEXT]: undefined
          }
        }
      },
      reviver
    );
    const testModel = nodeModelWithSelections.setIn(
      ['meta', 'selections'],
      testSelections
    );
    const { selections, idx } = getSelection(testModel, 8, 22);
  });
  test('creates new selection on paragraph with no selections', () => {
    const testModel = nodeModelWithSelections
      .set('content', testContent)
      .deleteIn(['meta', 'selections']);
    const testSelection = getSelection(testModel, 10, 15);
    // testModel.getIn(["meta", "selections"]).get(4)
    expect(testSelection).toMatchSnapshot();
  });
  test('creates new selection with intersection of overlapping Selection formats applied', () => {
    const selections = nodeModelWithSelections.getIn(['meta', 'selections']);
    // will now contain 3 Selections in a row that have SELECTION_ACTION_CODE formats
    const testModel = nodeModelWithSelections
      .set('content', testContent)
      .setIn(
        ['meta', 'selections'],
        selections
          .set(2, selections.get(2).set(SELECTION_ACTION_CODE, true))
          .set(3, selections.get(3).set(SELECTION_ACTION_CODE, true))
      );
    const testSelection = getSelection(testModel, 10, 20);
    expect(testSelection).toMatchSnapshot();
  });
  test('applies formats of outer selection if selection is made within one selection', () => {
    const testModel = nodeModelWithSelections.set('content', testContent);
    const testSelection = getSelection(testModel, 16, 20);
    // testModel.getIn(["meta", "selections"]).get(4)
    expect(testSelection).toMatchSnapshot();
  });
});

describe('upsertSelection', () => {
  test('insert first Selection', () => {
    const testModel = nodeModelWithSelections.setIn(
      ['meta', 'selections'],
      Selection()
    );
    const newSelection = Selection({
      [SELECTION_START]: 6,
      [SELECTION_END]: 12,
      [SELECTION_ACTION_ITALIC]: true
    });
    const expectedSelections = fromJS(
      [
        {
          start: 0,
          end: 6,
          'selection-bold': false,
          [SELECTION_ACTION_ITALIC]: false,
          [SELECTION_ACTION_CODE]: false,
          'selection-strikethrough': false,
          [SELECTION_ACTION_SITEINFO]: false,
          'selection-link': false,
          linkUrl: ''
        },
        {
          start: 6,
          end: 12,
          'selection-bold': false,
          [SELECTION_ACTION_ITALIC]: true,
          [SELECTION_ACTION_CODE]: false,
          'selection-strikethrough': false,
          [SELECTION_ACTION_SITEINFO]: false,
          'selection-link': false,
          linkUrl: ''
        },
        {
          start: 12,
          end: 30,
          'selection-bold': false,
          [SELECTION_ACTION_ITALIC]: false,
          [SELECTION_ACTION_CODE]: false,
          'selection-strikethrough': false,
          [SELECTION_ACTION_SITEINFO]: false,
          'selection-link': false,
          linkUrl: ''
        }
      ],
      reviver
    );
    const updatedModel = upsertSelection(testModel, newSelection);
    expect(
      updatedModel.getIn(['meta', 'selections']).equals(expectedSelections)
    ).toBe(true);
    expect(updatedModel).toMatchSnapshot();
  });
  test('new Selection matches existing Selection', () => {
    const testModel = nodeModelWithSelections.set('content', testContent);
    const updatedModel = upsertSelection(
      testModel,
      testModel
        .getIn(['meta', 'selections'])
        .get(4)
        .set(SELECTION_ACTION_BOLD, true)
    );
    expect(updatedModel).toMatchSnapshot();
  });
  test('new Selection overlaps existing Selections', () => {
    const testModel = nodeModelWithSelections.set('content', testContent);
    const newSelection = testModel
      .getIn(['meta', 'selections', 2])
      .set(SELECTION_ACTION_LINK, true)
      .set(SELECTION_LINK_URL, 'http://hot.flakes')
      .set(SELECTION_ACTION_BOLD, true)
      .set(SELECTION_START, 10)
      .set(SELECTION_END, 20);
    const updatedModel = upsertSelection(testModel, newSelection);
    expect(updatedModel).toMatchSnapshot();
  });
  test.todo('new Selection is inside existing Selection');
  test.todo("unset last Selection, should remove 'selections' key from 'meta'");
});

describe('splitSelectionsAtCaretOffset', () => {
  test('split in middle of selection', () => {
    const leftModel = nodeModelWithSelections.set('content', '');
    const rightModel = nodeModelWithSelections.set('content', '');
    const { leftNode, rightNode } = splitSelectionsAtCaretOffset(
      leftModel,
      rightModel,
      17
    );
    expect(leftNode).toMatchSnapshot();
    expect(rightNode).toMatchSnapshot();
  });
  test.todo('split at the edge of 2 Selections');
  test('split with selections on left and none on right', () => {
    const testModelLeft = fromJS(
      {
        post_id: 166,
        id: '21ba',
        parent_id: '39fb',
        position: 0,
        type: 'p',
        content: "Here's a first para",
        meta: {
          selections: [
            {
              start: 0,
              end: 9,
              'selection-bold': false,
              [SELECTION_ACTION_ITALIC]: false,
              [SELECTION_ACTION_CODE]: false,
              'selection-strikethrough': false,
              [SELECTION_ACTION_SITEINFO]: false,
              'selection-link': false,
              linkUrl: ''
            },
            {
              start: 9,
              end: 11,
              'selection-bold': false,
              [SELECTION_ACTION_ITALIC]: true,
              [SELECTION_ACTION_CODE]: true,
              'selection-strikethrough': false,
              [SELECTION_ACTION_SITEINFO]: false,
              'selection-link': false,
              linkUrl: ''
            },
            {
              start: 11,
              end: 32,
              'selection-bold': false,
              [SELECTION_ACTION_ITALIC]: false,
              [SELECTION_ACTION_CODE]: false,
              'selection-strikethrough': false,
              [SELECTION_ACTION_SITEINFO]: false,
              'selection-link': false,
              linkUrl: ''
            }
          ]
        }
      },
      reviver
    );
    const testModelRight = fromJS(
      {
        post_id: 166,
        id: '21bc',
        parent_id: '39fb',
        position: 1,
        type: 'p',
        content: 'graph because',
        meta: {}
      },
      reviver
    );
    const { leftNode, rightNode } = splitSelectionsAtCaretOffset(
      testModelLeft,
      testModelRight,
      19
    );
    expect(leftNode).toMatchSnapshot();
    expect(rightNode).toMatchSnapshot();
  });
});

describe('concatSelections', () => {
  test('neither left nor right model have selections', () => {
    const leftModel = nodeModelWithSelections.deleteIn(['meta', 'selections']);
    const rightModel = nodeModelWithSelections.deleteIn(['meta', 'selections']);
    const updatedModel = concatSelections(leftModel, rightModel);
    expect(updatedModel.getIn(['meta', 'selections'])).toBeUndefined();
  });
  test('left last selection has same formats as right first selection (merge)', () => {
    const firstSelection = nodeModelWithSelections
      .getIn(['meta', 'selections'])
      .get(0)
      .remove(SELECTION_ACTION_SITEINFO);
    const testSelections = nodeModelWithSelections
      .getIn(['meta', 'selections'])
      .shift()
      .unshift(firstSelection);
    const leftModel = nodeModelWithSelections.setIn(
      ['meta', 'selections'],
      testSelections
    );
    const rightModel = nodeModelWithSelections.setIn(
      ['meta', 'selections'],
      testSelections
    );
    const updatedModel = concatSelections(leftModel, rightModel);
    expect(updatedModel).toMatchSnapshot();
  });
  test.todo('left has no selections, right has selections');
  test.todo('left has selections, right nas no selections');
});

describe('getContentBySelections', () => {
  test('returns an array of content pieces broken out by selection lengths', () => {
    expect(getContentBySelections(nodeModelWithSelections)).toEqual([
      'And',
      ' a ',
      'second',
      ' ',
      'paragraph',
      ' because'
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
});

describe('formatSelections', () => {
  test("return empty string if argument isn't a List()", () => {
    expect(formatSelections([])).toBe('');
    expect(formatSelections({})).toBe('');
    expect(formatSelections(null)).toBe('');
  });
});
