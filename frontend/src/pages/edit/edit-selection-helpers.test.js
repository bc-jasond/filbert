import {
  SELECTION_ACTION_ITALIC,
  SELECTION_ACTION_SITEINFO,
  SELECTION_END,
  SELECTION_START,
  ZERO_LENGTH_CHAR
} from "../../common/constants";

const { fromJS } = require("immutable");
const { reviver } = require("./edit-document-model");
const {
  Selection,
  selectionReviver,
  adjustSelectionOffsetsAndCleanup,
  getSelection,
  upsertSelection,
  splitSelectionsAtCaretOffset,
  concatSelections,
  getContentForSelection,
  getSelectionKey
} = require("./edit-selection-helpers");

const testContent = "And a second paragraph because";
const nodeModelWithSelections = fromJS(
  {
    type: "p",
    parent_id: "39fb",
    position: 1,
    content: "",
    meta: {
      selections: [
        {
          start: 0,
          end: 3,
          "selection-bold": false,
          "selection-italic": false,
          "selection-code": false,
          "selection-strikethrough": false,
          "selection-siteinfo": true,
          "selection-link": false,
          linkUrl: ""
        },
        {
          start: 3,
          end: 6,
          "selection-bold": false,
          "selection-italic": false,
          "selection-code": false,
          "selection-strikethrough": false,
          "selection-siteinfo": false,
          "selection-link": false,
          linkUrl: ""
        },
        {
          start: 6,
          end: 12,
          "selection-bold": false,
          "selection-italic": true,
          "selection-code": false,
          "selection-strikethrough": false,
          "selection-siteinfo": false,
          "selection-link": false,
          linkUrl: ""
        },
        {
          start: 12,
          end: 13,
          "selection-bold": false,
          "selection-italic": false,
          "selection-code": false,
          "selection-strikethrough": false,
          "selection-siteinfo": false,
          "selection-link": false,
          linkUrl: ""
        },
        {
          start: 13,
          end: 22,
          "selection-bold": false,
          "selection-italic": false,
          "selection-code": true,
          "selection-strikethrough": false,
          "selection-siteinfo": false,
          "selection-link": false,
          linkUrl: ""
        },
        {
          start: 22,
          end: 30,
          "selection-bold": false,
          "selection-italic": false,
          "selection-code": false,
          "selection-strikethrough": false,
          "selection-siteinfo": false,
          "selection-link": false,
          linkUrl: ""
        }
      ]
    },
    id: "6eda",
    post_id: 166
  },
  reviver
);

beforeAll(() => {
  console.debug = () => {};
  console.info = () => {};
  console.log = () => {};
});

describe("selectionReviver", () => {
  test(`return Selection when JS object has '${SELECTION_START}' and '${SELECTION_END}' keys`, () => {
    const expectedSelection = Selection({
      [SELECTION_START]: 3,
      [SELECTION_END]: 8
    });
    expect(
      fromJS({ [SELECTION_START]: 3, [SELECTION_END]: 8 }, selectionReviver)
    ).toMatchInlineSnapshot(`
      Immutable.Record {
        "start": 3,
        "end": 8,
        "selection-bold": false,
        "selection-italic": false,
        "selection-code": false,
        "selection-strikethrough": false,
        "selection-siteinfo": false,
        "selection-link": false,
        "linkUrl": "",
      }
    `);
  });
});

describe("adjustSelectionOffsetsAndCleanup", () => {
  test('delete all characters up to caret (when "end" in handleBackspace)', () => {
    const expectedSelections = fromJS(
      [
        {
          start: 0,
          end: 5,
          "selection-bold": false,
          "selection-italic": false,
          "selection-code": true,
          "selection-strikethrough": false,
          "selection-siteinfo": false,
          "selection-link": false,
          linkUrl: ""
        },
        {
          start: 5,
          end: 13,
          "selection-bold": false,
          "selection-italic": false,
          "selection-code": false,
          "selection-strikethrough": false,
          "selection-siteinfo": false,
          "selection-link": false,
          linkUrl: ""
        }
      ],
      reviver
    );

    const testModel = nodeModelWithSelections.set(
      "content",
      testContent.substring(17)
    );
    const modelAdjusted = adjustSelectionOffsetsAndCleanup(testModel, 17, -17);
    expect(
      modelAdjusted.getIn(["meta", "selections"]).equals(expectedSelections)
    ).toBe(true);
    expect(modelAdjusted).toMatchInlineSnapshot(`
      Immutable.Map {
        "type": "p",
        "parent_id": "39fb",
        "position": 1,
        "content": "graph because",
        "meta": Immutable.Map {
          "selections": Immutable.List [
            Immutable.Record {
              "start": 0,
              "end": 5,
              "selection-bold": false,
              "selection-italic": false,
              "selection-code": true,
              "selection-strikethrough": false,
              "selection-siteinfo": false,
              "selection-link": false,
              "linkUrl": "",
            },
            Immutable.Record {
              "start": 5,
              "end": 13,
              "selection-bold": false,
              "selection-italic": false,
              "selection-code": false,
              "selection-strikethrough": false,
              "selection-siteinfo": false,
              "selection-link": false,
              "linkUrl": "",
            },
          ],
        },
        "id": "6eda",
        "post_id": 166,
      }
    `);
  });
  test('delete all characters from caret through the end (when "start" with multiple nodes in handleBackspace)', () => {
    const expectedSelections = fromJS(
      [
        {
          start: 0,
          end: 3,
          "selection-bold": false,
          "selection-italic": false,
          "selection-code": false,
          "selection-strikethrough": false,
          "selection-siteinfo": true,
          "selection-link": false,
          linkUrl: ""
        },
        {
          start: 3,
          end: 6,
          "selection-bold": false,
          "selection-italic": false,
          "selection-code": false,
          "selection-strikethrough": false,
          "selection-siteinfo": false,
          "selection-link": false,
          linkUrl: ""
        },
        {
          start: 6,
          end: 12,
          "selection-bold": false,
          "selection-italic": true,
          "selection-code": false,
          "selection-strikethrough": false,
          "selection-siteinfo": false,
          "selection-link": false,
          linkUrl: ""
        },
        {
          start: 12,
          end: 13,
          "selection-bold": false,
          "selection-italic": false,
          "selection-code": false,
          "selection-strikethrough": false,
          "selection-siteinfo": false,
          "selection-link": false,
          linkUrl: ""
        },
        {
          start: 13,
          end: 17,
          "selection-bold": false,
          "selection-italic": false,
          "selection-code": true,
          "selection-strikethrough": false,
          "selection-siteinfo": false,
          "selection-link": false,
          linkUrl: ""
        }
      ],
      reviver
    );

    const testModel = nodeModelWithSelections.set(
      "content",
      testContent.substring(0, 17)
    );
    const modelAdjusted = adjustSelectionOffsetsAndCleanup(testModel, 30, -13);
    expect(
      modelAdjusted.getIn(["meta", "selections"]).equals(expectedSelections)
    ).toBe(true);
    expect(modelAdjusted).toMatchInlineSnapshot(`
      Immutable.Map {
        "type": "p",
        "parent_id": "39fb",
        "position": 1,
        "content": "And a second para",
        "meta": Immutable.Map {
          "selections": Immutable.List [
            Immutable.Record {
              "start": 0,
              "end": 3,
              "selection-bold": false,
              "selection-italic": false,
              "selection-code": false,
              "selection-strikethrough": false,
              "selection-siteinfo": true,
              "selection-link": false,
              "linkUrl": "",
            },
            Immutable.Record {
              "start": 3,
              "end": 6,
              "selection-bold": false,
              "selection-italic": false,
              "selection-code": false,
              "selection-strikethrough": false,
              "selection-siteinfo": false,
              "selection-link": false,
              "linkUrl": "",
            },
            Immutable.Record {
              "start": 6,
              "end": 12,
              "selection-bold": false,
              "selection-italic": true,
              "selection-code": false,
              "selection-strikethrough": false,
              "selection-siteinfo": false,
              "selection-link": false,
              "linkUrl": "",
            },
            Immutable.Record {
              "start": 12,
              "end": 13,
              "selection-bold": false,
              "selection-italic": false,
              "selection-code": false,
              "selection-strikethrough": false,
              "selection-siteinfo": false,
              "selection-link": false,
              "linkUrl": "",
            },
            Immutable.Record {
              "start": 13,
              "end": 17,
              "selection-bold": false,
              "selection-italic": false,
              "selection-code": true,
              "selection-strikethrough": false,
              "selection-siteinfo": false,
              "selection-link": false,
              "linkUrl": "",
            },
          ],
        },
        "id": "6eda",
        "post_id": 166,
      }
    `);
  });
  test("delete some characters from middle, deletes a selection, adjusts overlapping selections", () => {
    const expectedSelections = fromJS(
      [
        {
          start: 0,
          end: 3,
          "selection-bold": false,
          "selection-italic": false,
          "selection-code": false,
          "selection-strikethrough": false,
          "selection-siteinfo": true,
          "selection-link": false,
          linkUrl: ""
        },
        {
          start: 3,
          end: 4,
          "selection-bold": false,
          "selection-italic": false,
          "selection-code": false,
          "selection-strikethrough": false,
          "selection-siteinfo": false,
          "selection-link": false,
          linkUrl: ""
        },
        {
          start: 4,
          end: 9,
          "selection-bold": false,
          "selection-italic": false,
          "selection-code": true,
          "selection-strikethrough": false,
          "selection-siteinfo": false,
          "selection-link": false,
          linkUrl: ""
        },
        {
          start: 9,
          end: 17,
          "selection-bold": false,
          "selection-italic": false,
          "selection-code": false,
          "selection-strikethrough": false,
          "selection-siteinfo": false,
          "selection-link": false,
          linkUrl: ""
        }
      ],
      reviver
    );
    const testModel = nodeModelWithSelections.set(
      "content",
      `${testContent.substring(0, 4)}${testContent.substring(17)}`
    );
    const modelAdjusted = adjustSelectionOffsetsAndCleanup(testModel, 17, -13);
    expect(
      modelAdjusted.getIn(["meta", "selections"]).equals(expectedSelections)
    ).toBe(true);
    expect(modelAdjusted).toMatchInlineSnapshot(`
      Immutable.Map {
        "type": "p",
        "parent_id": "39fb",
        "position": 1,
        "content": "And graph because",
        "meta": Immutable.Map {
          "selections": Immutable.List [
            Immutable.Record {
              "start": 0,
              "end": 3,
              "selection-bold": false,
              "selection-italic": false,
              "selection-code": false,
              "selection-strikethrough": false,
              "selection-siteinfo": true,
              "selection-link": false,
              "linkUrl": "",
            },
            Immutable.Record {
              "start": 3,
              "end": 4,
              "selection-bold": false,
              "selection-italic": false,
              "selection-code": false,
              "selection-strikethrough": false,
              "selection-siteinfo": false,
              "selection-link": false,
              "linkUrl": "",
            },
            Immutable.Record {
              "start": 4,
              "end": 9,
              "selection-bold": false,
              "selection-italic": false,
              "selection-code": true,
              "selection-strikethrough": false,
              "selection-siteinfo": false,
              "selection-link": false,
              "linkUrl": "",
            },
            Immutable.Record {
              "start": 9,
              "end": 17,
              "selection-bold": false,
              "selection-italic": false,
              "selection-code": false,
              "selection-strikethrough": false,
              "selection-siteinfo": false,
              "selection-link": false,
              "linkUrl": "",
            },
          ],
        },
        "id": "6eda",
        "post_id": 166,
      }
    `);
  });
  test("delete some characters from middle of one selection", () => {
    const expectedSelections = fromJS(
      [
        {
          start: 0,
          end: 3,
          "selection-bold": false,
          "selection-italic": false,
          "selection-code": false,
          "selection-strikethrough": false,
          "selection-siteinfo": true,
          "selection-link": false,
          linkUrl: ""
        },
        {
          start: 3,
          end: 6,
          "selection-bold": false,
          "selection-italic": false,
          "selection-code": false,
          "selection-strikethrough": false,
          "selection-siteinfo": false,
          "selection-link": false,
          linkUrl: ""
        },
        {
          start: 6,
          end: 9,
          "selection-bold": false,
          "selection-italic": true,
          "selection-code": false,
          "selection-strikethrough": false,
          "selection-siteinfo": false,
          "selection-link": false,
          linkUrl: ""
        },
        {
          start: 9,
          end: 10,
          "selection-bold": false,
          "selection-italic": false,
          "selection-code": false,
          "selection-strikethrough": false,
          "selection-siteinfo": false,
          "selection-link": false,
          linkUrl: ""
        },
        {
          start: 10,
          end: 19,
          "selection-bold": false,
          "selection-italic": false,
          "selection-code": true,
          "selection-strikethrough": false,
          "selection-siteinfo": false,
          "selection-link": false,
          linkUrl: ""
        },
        {
          start: 19,
          end: 27,
          "selection-bold": false,
          "selection-italic": false,
          "selection-code": false,
          "selection-strikethrough": false,
          "selection-siteinfo": false,
          "selection-link": false,
          linkUrl: ""
        }
      ],
      reviver
    );
    const testModel = nodeModelWithSelections.set(
      "content",
      `${testContent.substring(0, 8)}${testContent.substring(11)}`
    );
    const modelAdjusted = adjustSelectionOffsetsAndCleanup(testModel, 11, -3);
    expect(
      modelAdjusted.getIn(["meta", "selections"]).equals(expectedSelections)
    ).toBe(true);
    expect(modelAdjusted).toMatchInlineSnapshot(`
      Immutable.Map {
        "type": "p",
        "parent_id": "39fb",
        "position": 1,
        "content": "And a sed paragraph because",
        "meta": Immutable.Map {
          "selections": Immutable.List [
            Immutable.Record {
              "start": 0,
              "end": 3,
              "selection-bold": false,
              "selection-italic": false,
              "selection-code": false,
              "selection-strikethrough": false,
              "selection-siteinfo": true,
              "selection-link": false,
              "linkUrl": "",
            },
            Immutable.Record {
              "start": 3,
              "end": 6,
              "selection-bold": false,
              "selection-italic": false,
              "selection-code": false,
              "selection-strikethrough": false,
              "selection-siteinfo": false,
              "selection-link": false,
              "linkUrl": "",
            },
            Immutable.Record {
              "start": 6,
              "end": 9,
              "selection-bold": false,
              "selection-italic": true,
              "selection-code": false,
              "selection-strikethrough": false,
              "selection-siteinfo": false,
              "selection-link": false,
              "linkUrl": "",
            },
            Immutable.Record {
              "start": 9,
              "end": 10,
              "selection-bold": false,
              "selection-italic": false,
              "selection-code": false,
              "selection-strikethrough": false,
              "selection-siteinfo": false,
              "selection-link": false,
              "linkUrl": "",
            },
            Immutable.Record {
              "start": 10,
              "end": 19,
              "selection-bold": false,
              "selection-italic": false,
              "selection-code": true,
              "selection-strikethrough": false,
              "selection-siteinfo": false,
              "selection-link": false,
              "linkUrl": "",
            },
            Immutable.Record {
              "start": 19,
              "end": 27,
              "selection-bold": false,
              "selection-italic": false,
              "selection-code": false,
              "selection-strikethrough": false,
              "selection-siteinfo": false,
              "selection-link": false,
              "linkUrl": "",
            },
          ],
        },
        "id": "6eda",
        "post_id": 166,
      }
    `);
  });
  test("delete all characters", () => {
    const modelAdjusted = adjustSelectionOffsetsAndCleanup(
      nodeModelWithSelections,
      30,
      -30
    );
    expect(modelAdjusted.getIn(["meta", "selections"]).equals(fromJS([]))).toBe(
      true
    );
    expect(modelAdjusted).toMatchInlineSnapshot(`
      Immutable.Map {
        "type": "p",
        "parent_id": "39fb",
        "position": 1,
        "content": "",
        "meta": Immutable.Map {
          "selections": Immutable.List [],
        },
        "id": "6eda",
        "post_id": 166,
      }
    `);
  });
  test("noop - default arguments", () => {
    const testModel = nodeModelWithSelections.set("content", testContent);
    const modelAdjusted = adjustSelectionOffsetsAndCleanup(testModel);
    expect(
      modelAdjusted
        .getIn(["meta", "selections"])
        .equals(testModel.getIn(["meta", "selections"]))
    ).toBe(true);
    expect(modelAdjusted).toMatchInlineSnapshot(`
      Immutable.Map {
        "type": "p",
        "parent_id": "39fb",
        "position": 1,
        "content": "And a second paragraph because",
        "meta": Immutable.Map {
          "selections": Immutable.List [
            Immutable.Record {
              "start": 0,
              "end": 3,
              "selection-bold": false,
              "selection-italic": false,
              "selection-code": false,
              "selection-strikethrough": false,
              "selection-siteinfo": true,
              "selection-link": false,
              "linkUrl": "",
            },
            Immutable.Record {
              "start": 3,
              "end": 6,
              "selection-bold": false,
              "selection-italic": false,
              "selection-code": false,
              "selection-strikethrough": false,
              "selection-siteinfo": false,
              "selection-link": false,
              "linkUrl": "",
            },
            Immutable.Record {
              "start": 6,
              "end": 12,
              "selection-bold": false,
              "selection-italic": true,
              "selection-code": false,
              "selection-strikethrough": false,
              "selection-siteinfo": false,
              "selection-link": false,
              "linkUrl": "",
            },
            Immutable.Record {
              "start": 12,
              "end": 13,
              "selection-bold": false,
              "selection-italic": false,
              "selection-code": false,
              "selection-strikethrough": false,
              "selection-siteinfo": false,
              "selection-link": false,
              "linkUrl": "",
            },
            Immutable.Record {
              "start": 13,
              "end": 22,
              "selection-bold": false,
              "selection-italic": false,
              "selection-code": true,
              "selection-strikethrough": false,
              "selection-siteinfo": false,
              "selection-link": false,
              "linkUrl": "",
            },
            Immutable.Record {
              "start": 22,
              "end": 30,
              "selection-bold": false,
              "selection-italic": false,
              "selection-code": false,
              "selection-strikethrough": false,
              "selection-siteinfo": false,
              "selection-link": false,
              "linkUrl": "",
            },
          ],
        },
        "id": "6eda",
        "post_id": 166,
      }
    `);
  });
  test("paste a word with collapsed caret (similar to adding one character on keypress)", () => {
    const expectedSelections = fromJS(
      [
        {
          start: 0,
          end: 3,
          "selection-bold": false,
          "selection-italic": false,
          "selection-code": false,
          "selection-strikethrough": false,
          "selection-siteinfo": true,
          "selection-link": false,
          linkUrl: ""
        },
        {
          start: 3,
          end: 10,
          "selection-bold": false,
          "selection-italic": false,
          "selection-code": false,
          "selection-strikethrough": false,
          "selection-siteinfo": false,
          "selection-link": false,
          linkUrl: ""
        },
        {
          start: 10,
          end: 16,
          "selection-bold": false,
          "selection-italic": true,
          "selection-code": false,
          "selection-strikethrough": false,
          "selection-siteinfo": false,
          "selection-link": false,
          linkUrl: ""
        },
        {
          start: 16,
          end: 17,
          "selection-bold": false,
          "selection-italic": false,
          "selection-code": false,
          "selection-strikethrough": false,
          "selection-siteinfo": false,
          "selection-link": false,
          linkUrl: ""
        },
        {
          start: 17,
          end: 26,
          "selection-bold": false,
          "selection-italic": false,
          "selection-code": true,
          "selection-strikethrough": false,
          "selection-siteinfo": false,
          "selection-link": false,
          linkUrl: ""
        },
        {
          start: 26,
          end: 34,
          "selection-bold": false,
          "selection-italic": false,
          "selection-code": false,
          "selection-strikethrough": false,
          "selection-siteinfo": false,
          "selection-link": false,
          linkUrl: ""
        }
      ],
      reviver
    );
    const testModel = nodeModelWithSelections.set(
      "content",
      `${testContent.substring(0, 5)}pple${testContent.substring(5)}`
    );
    const modelAdjusted = adjustSelectionOffsetsAndCleanup(testModel, 5, 4);
    expect(
      modelAdjusted.getIn(["meta", "selections"]).equals(expectedSelections)
    ).toBe(true);
    expect(modelAdjusted).toMatchInlineSnapshot(`
      Immutable.Map {
        "type": "p",
        "parent_id": "39fb",
        "position": 1,
        "content": "And apple second paragraph because",
        "meta": Immutable.Map {
          "selections": Immutable.List [
            Immutable.Record {
              "start": 0,
              "end": 3,
              "selection-bold": false,
              "selection-italic": false,
              "selection-code": false,
              "selection-strikethrough": false,
              "selection-siteinfo": true,
              "selection-link": false,
              "linkUrl": "",
            },
            Immutable.Record {
              "start": 3,
              "end": 10,
              "selection-bold": false,
              "selection-italic": false,
              "selection-code": false,
              "selection-strikethrough": false,
              "selection-siteinfo": false,
              "selection-link": false,
              "linkUrl": "",
            },
            Immutable.Record {
              "start": 10,
              "end": 16,
              "selection-bold": false,
              "selection-italic": true,
              "selection-code": false,
              "selection-strikethrough": false,
              "selection-siteinfo": false,
              "selection-link": false,
              "linkUrl": "",
            },
            Immutable.Record {
              "start": 16,
              "end": 17,
              "selection-bold": false,
              "selection-italic": false,
              "selection-code": false,
              "selection-strikethrough": false,
              "selection-siteinfo": false,
              "selection-link": false,
              "linkUrl": "",
            },
            Immutable.Record {
              "start": 17,
              "end": 26,
              "selection-bold": false,
              "selection-italic": false,
              "selection-code": true,
              "selection-strikethrough": false,
              "selection-siteinfo": false,
              "selection-link": false,
              "linkUrl": "",
            },
            Immutable.Record {
              "start": 26,
              "end": 34,
              "selection-bold": false,
              "selection-italic": false,
              "selection-code": false,
              "selection-strikethrough": false,
              "selection-siteinfo": false,
              "selection-link": false,
              "linkUrl": "",
            },
          ],
        },
        "id": "6eda",
        "post_id": 166,
      }
    `);
  });
});

describe("getSelection", () => {});

describe("upsertSelection", () => {
  test("insert first Selection", () => {
    const testModel = nodeModelWithSelections
      .deleteIn(["meta", "selections"])
      .set("content", testContent);
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
          "selection-bold": false,
          "selection-italic": false,
          "selection-code": false,
          "selection-strikethrough": false,
          "selection-siteinfo": false,
          "selection-link": false,
          linkUrl: ""
        },
        {
          start: 6,
          end: 12,
          "selection-bold": false,
          "selection-italic": true,
          "selection-code": false,
          "selection-strikethrough": false,
          "selection-siteinfo": false,
          "selection-link": false,
          linkUrl: ""
        },
        {
          start: 12,
          end: 30,
          "selection-bold": false,
          "selection-italic": false,
          "selection-code": false,
          "selection-strikethrough": false,
          "selection-siteinfo": false,
          "selection-link": false,
          linkUrl: ""
        }
      ],
      reviver
    );
    const updatedModel = upsertSelection(testModel, newSelection);
    expect(
      updatedModel.getIn(["meta", "selections"]).equals(expectedSelections)
    ).toBe(true);
    expect(updatedModel).toMatchInlineSnapshot(`
      Immutable.Map {
        "type": "p",
        "parent_id": "39fb",
        "position": 1,
        "content": "And a second paragraph because",
        "meta": Immutable.Map {
          "selections": Immutable.List [
            Immutable.Record {
              "start": 0,
              "end": 6,
              "selection-bold": false,
              "selection-italic": false,
              "selection-code": false,
              "selection-strikethrough": false,
              "selection-siteinfo": false,
              "selection-link": false,
              "linkUrl": "",
            },
            Immutable.Record {
              "start": 6,
              "end": 12,
              "selection-bold": false,
              "selection-italic": true,
              "selection-code": false,
              "selection-strikethrough": false,
              "selection-siteinfo": false,
              "selection-link": false,
              "linkUrl": "",
            },
            Immutable.Record {
              "start": 12,
              "end": 30,
              "selection-bold": false,
              "selection-italic": false,
              "selection-code": false,
              "selection-strikethrough": false,
              "selection-siteinfo": false,
              "selection-link": false,
              "linkUrl": "",
            },
          ],
        },
        "id": "6eda",
        "post_id": 166,
      }
    `);
  });
  test.todo("new Selection matches existing Selection");
  test.todo("new Selection overlaps existing Selection to the left");
  test.todo("new Selection overlaps existing Selection to the right");
  test.todo("new Selection is inside existing Selection");
  test.todo("unset last Selection, should remove 'selections' key from 'meta'");
});

describe("splitSelectionsAtCaretOffset", () => {
  test("split in middle of selection", () => {
    const leftModel = nodeModelWithSelections.set("content", "");
    const rightModel = nodeModelWithSelections.set("content", "");
    const [testLeft, testRight] = splitSelectionsAtCaretOffset(
      leftModel,
      rightModel,
      17
    );
    expect(testLeft).toMatchInlineSnapshot(`
      Immutable.Map {
        "type": "p",
        "parent_id": "39fb",
        "position": 1,
        "content": "",
        "meta": Immutable.Map {
          "selections": Immutable.List [
            Immutable.Record {
              "start": 0,
              "end": 3,
              "selection-bold": false,
              "selection-italic": false,
              "selection-code": false,
              "selection-strikethrough": false,
              "selection-siteinfo": true,
              "selection-link": false,
              "linkUrl": "",
            },
            Immutable.Record {
              "start": 3,
              "end": 6,
              "selection-bold": false,
              "selection-italic": false,
              "selection-code": false,
              "selection-strikethrough": false,
              "selection-siteinfo": false,
              "selection-link": false,
              "linkUrl": "",
            },
            Immutable.Record {
              "start": 6,
              "end": 12,
              "selection-bold": false,
              "selection-italic": true,
              "selection-code": false,
              "selection-strikethrough": false,
              "selection-siteinfo": false,
              "selection-link": false,
              "linkUrl": "",
            },
            Immutable.Record {
              "start": 12,
              "end": 13,
              "selection-bold": false,
              "selection-italic": false,
              "selection-code": false,
              "selection-strikethrough": false,
              "selection-siteinfo": false,
              "selection-link": false,
              "linkUrl": "",
            },
            Immutable.Record {
              "start": 13,
              "end": 17,
              "selection-bold": false,
              "selection-italic": false,
              "selection-code": true,
              "selection-strikethrough": false,
              "selection-siteinfo": false,
              "selection-link": false,
              "linkUrl": "",
            },
          ],
        },
        "id": "6eda",
        "post_id": 166,
      }
    `);
    expect(testRight).toMatchInlineSnapshot(`
      Immutable.Map {
        "type": "p",
        "parent_id": "39fb",
        "position": 1,
        "content": "",
        "meta": Immutable.Map {
          "selections": Immutable.List [
            Immutable.Record {
              "start": 0,
              "end": 5,
              "selection-bold": false,
              "selection-italic": false,
              "selection-code": true,
              "selection-strikethrough": false,
              "selection-siteinfo": false,
              "selection-link": false,
              "linkUrl": "",
            },
            Immutable.Record {
              "start": 5,
              "end": 13,
              "selection-bold": false,
              "selection-italic": false,
              "selection-code": false,
              "selection-strikethrough": false,
              "selection-siteinfo": false,
              "selection-link": false,
              "linkUrl": "",
            },
          ],
        },
        "id": "6eda",
        "post_id": 166,
      }
    `);
  });
  test.todo("split at the edge of 2 Selections")
  test.todo("split with no selections")
});

describe("concatSelections", () => {
  test("neither left nor right model have selections", () => {
    const leftModel = nodeModelWithSelections.deleteIn(["meta", "selections"]);
    const rightModel = nodeModelWithSelections.deleteIn(["meta", "selections"]);
    const updatedModel = concatSelections(leftModel, rightModel);
    expect(updatedModel.getIn(["meta", "selections"])).toBeUndefined();
  });
  test("left last selection has same formats as right first selection (merge)", () => {
    const firstSelection = nodeModelWithSelections
      .getIn(["meta", "selections"])
      .get(0)
      .remove(SELECTION_ACTION_SITEINFO);
    const testSelections = nodeModelWithSelections
      .getIn(["meta", "selections"])
      .shift()
      .unshift(firstSelection);
    const leftModel = nodeModelWithSelections.setIn(
      ["meta", "selections"],
      testSelections
    );
    const rightModel = nodeModelWithSelections.setIn(
      ["meta", "selections"],
      testSelections
    );
    const updatedModel = concatSelections(leftModel, rightModel);
    expect(updatedModel).toMatchInlineSnapshot(`
      Immutable.Map {
        "type": "p",
        "parent_id": "39fb",
        "position": 1,
        "content": "",
        "meta": Immutable.Map {
          "selections": Immutable.List [
            Immutable.Record {
              "start": 0,
              "end": 6,
              "selection-bold": false,
              "selection-italic": false,
              "selection-code": false,
              "selection-strikethrough": false,
              "selection-siteinfo": false,
              "selection-link": false,
              "linkUrl": "",
            },
            Immutable.Record {
              "start": 6,
              "end": 12,
              "selection-bold": false,
              "selection-italic": true,
              "selection-code": false,
              "selection-strikethrough": false,
              "selection-siteinfo": false,
              "selection-link": false,
              "linkUrl": "",
            },
            Immutable.Record {
              "start": 12,
              "end": 13,
              "selection-bold": false,
              "selection-italic": false,
              "selection-code": false,
              "selection-strikethrough": false,
              "selection-siteinfo": false,
              "selection-link": false,
              "linkUrl": "",
            },
            Immutable.Record {
              "start": 13,
              "end": 22,
              "selection-bold": false,
              "selection-italic": false,
              "selection-code": true,
              "selection-strikethrough": false,
              "selection-siteinfo": false,
              "selection-link": false,
              "linkUrl": "",
            },
            Immutable.Record {
              "start": 22,
              "end": 36,
              "selection-bold": false,
              "selection-italic": false,
              "selection-code": false,
              "selection-strikethrough": false,
              "selection-siteinfo": false,
              "selection-link": false,
              "linkUrl": "",
            },
            Immutable.Record {
              "start": 36,
              "end": 42,
              "selection-bold": false,
              "selection-italic": true,
              "selection-code": false,
              "selection-strikethrough": false,
              "selection-siteinfo": false,
              "selection-link": false,
              "linkUrl": "",
            },
            Immutable.Record {
              "start": 42,
              "end": 43,
              "selection-bold": false,
              "selection-italic": false,
              "selection-code": false,
              "selection-strikethrough": false,
              "selection-siteinfo": false,
              "selection-link": false,
              "linkUrl": "",
            },
            Immutable.Record {
              "start": 43,
              "end": 52,
              "selection-bold": false,
              "selection-italic": false,
              "selection-code": true,
              "selection-strikethrough": false,
              "selection-siteinfo": false,
              "selection-link": false,
              "linkUrl": "",
            },
            Immutable.Record {
              "start": 52,
              "end": 60,
              "selection-bold": false,
              "selection-italic": false,
              "selection-code": false,
              "selection-strikethrough": false,
              "selection-siteinfo": false,
              "selection-link": false,
              "linkUrl": "",
            },
          ],
        },
        "id": "6eda",
        "post_id": 166,
      }
    `);
  });
  test.todo("left has no selections, right has selections");
  test.todo("left has selections, right nas no selections");
});

describe("getContentForSelection", () => {
  test("nominal case", () => {
    const testModel = nodeModelWithSelections.set("content", testContent);
    const selection = testModel.getIn(["meta", "selections"]).get(4);
    expect(getContentForSelection(testModel, selection)).toMatchInlineSnapshot(
      `"paragraph"`
    );
  });
  test("Selection offsets out of bounds should throw", () => {
    let testModel = nodeModelWithSelections.set("content", null);
    const selection = testModel.getIn(["meta", "selections"]).get(4);
    expect(() => {
      getContentForSelection(testModel, selection);
    }).toThrow();
    testModel = testModel.set("content", undefined);
    expect(() => {
      getContentForSelection(testModel, selection);
    }).toThrow();
  });
});

describe("getSelectionKey", () => {
  test("get key for Selection", () => {
    const testSelection = fromJS(
      {
        start: 12,
        end: 115,
        "selection-bold": true,
        "selection-italic": false,
        "selection-code": true,
        "selection-strikethrough": false,
        "selection-siteinfo": false,
        "selection-link": false,
        linkUrl: ""
      },
      reviver
    );
    expect(getSelectionKey(testSelection)).toMatchInlineSnapshot(
      `"12-115-1-0-1-0-0-0"`
    );
  });
});
