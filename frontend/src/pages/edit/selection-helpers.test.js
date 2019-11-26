import {
  SELECTION_ACTION_BOLD,
  SELECTION_ACTION_CODE,
  SELECTION_ACTION_ITALIC,
  SELECTION_ACTION_LINK,
  SELECTION_ACTION_SITEINFO,
  SELECTION_END,
  SELECTION_LINK_URL,
  SELECTION_START
} from "../../common/constants";

const { fromJS } = require("immutable");
const { reviver } = require("./edit-document-model");
const {
  Selection,
  formatSelections,
  selectionReviver,
  adjustSelectionOffsetsAndCleanup,
  getSelection,
  upsertSelection,
  splitSelectionsAtCaretOffset,
  concatSelections,
  getContentForSelection,
  getSelectionKey
} = require("./selection-helpers");

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
  test('delete all highlighted characters up to caret (when "end" in handleBackspace)', () => {
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
    const modelAdjusted = adjustSelectionOffsetsAndCleanup(
      testModel,
      testContent,
      17,
      -17
    );
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
  test("delete all highlighted characters up to caret (up to edge of a selection)", () => {
    const prevContent = "and some paragraph for good measure?";
    const testModel = fromJS(
      {
        type: "p",
        parent_id: "39fb",
        position: 1,
        content: "paragraph for good measure?",
        meta: {
          selections: [
            {
              start: 0,
              end: 9,
              "selection-bold": false,
              "selection-italic": false,
              "selection-code": false,
              "selection-strikethrough": false,
              "selection-siteinfo": false,
              "selection-link": false,
              linkUrl: ""
            },
            {
              start: 9,
              end: 18,
              "selection-bold": false,
              "selection-italic": false,
              "selection-code": true,
              "selection-strikethrough": false,
              "selection-siteinfo": false,
              "selection-link": false,
              linkUrl: ""
            },
            {
              start: 18,
              end: 23,
              "selection-bold": false,
              "selection-italic": false,
              "selection-code": false,
              "selection-strikethrough": false,
              "selection-siteinfo": false,
              "selection-link": false,
              linkUrl: ""
            },
            {
              start: 23,
              end: 27,
              "selection-bold": true,
              "selection-italic": true,
              "selection-code": false,
              "selection-strikethrough": false,
              "selection-siteinfo": false,
              "selection-link": false,
              linkUrl: ""
            },
            {
              start: 27,
              end: 36,
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
        id: "ce7b",
        post_id: 166
      },
      reviver
    );
    const updatedModel = adjustSelectionOffsetsAndCleanup(
      testModel,
      prevContent,
      9,
      -9
    );
    expect(updatedModel).toMatchInlineSnapshot(`
      Immutable.Map {
        "type": "p",
        "parent_id": "39fb",
        "position": 1,
        "content": "paragraph for good measure?",
        "meta": Immutable.Map {
          "selections": Immutable.List [
            Immutable.Record {
              "start": 0,
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
              "end": 14,
              "selection-bold": false,
              "selection-italic": false,
              "selection-code": false,
              "selection-strikethrough": false,
              "selection-siteinfo": false,
              "selection-link": false,
              "linkUrl": "",
            },
            Immutable.Record {
              "start": 14,
              "end": 18,
              "selection-bold": true,
              "selection-italic": true,
              "selection-code": false,
              "selection-strikethrough": false,
              "selection-siteinfo": false,
              "selection-link": false,
              "linkUrl": "",
            },
            Immutable.Record {
              "start": 18,
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
        "id": "ce7b",
        "post_id": 166,
      }
    `);
  });
  test('delete all highlighted characters from caret through the end (when "start" with multiple nodes in handleBackspace)', () => {
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
    const modelAdjusted = adjustSelectionOffsetsAndCleanup(
      testModel,
      testContent,
      30,
      -13
    );
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
  test("delete highlighted characters from middle, deletes a selection, adjusts overlapping selections", () => {
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
    const modelAdjusted = adjustSelectionOffsetsAndCleanup(
      testModel,
      testContent,
      17,
      -13
    );
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
  test("delete highlighted characters from middle of one selection", () => {
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
    const modelAdjusted = adjustSelectionOffsetsAndCleanup(
      testModel,
      testContent,
      11,
      -3
    );
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
      testContent,
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
    const modelAdjusted = adjustSelectionOffsetsAndCleanup(
      testModel,
      testContent,
      5,
      4
    );
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
  test.todo("add one character at the boundary of two selections");
  test.todo(
    "delete one highlighted character at the boundary of two selections"
  );
  test("delete one character (caret collapsed) at the boundary of two selections", () => {
    const testModel = nodeModelWithSelections.set(
      "content",
      `${testContent.substring(0, 11)}${testContent.substring(12)}`
    );
    const updatedModel = adjustSelectionOffsetsAndCleanup(
      testModel,
      testContent,
      12,
      -1
    );
    expect(updatedModel).toMatchInlineSnapshot(`
      Immutable.Map {
        "type": "p",
        "parent_id": "39fb",
        "position": 1,
        "content": "And a secon paragraph because",
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
              "end": 11,
              "selection-bold": false,
              "selection-italic": true,
              "selection-code": false,
              "selection-strikethrough": false,
              "selection-siteinfo": false,
              "selection-link": false,
              "linkUrl": "",
            },
            Immutable.Record {
              "start": 11,
              "end": 12,
              "selection-bold": false,
              "selection-italic": false,
              "selection-code": false,
              "selection-strikethrough": false,
              "selection-siteinfo": false,
              "selection-link": false,
              "linkUrl": "",
            },
            Immutable.Record {
              "start": 12,
              "end": 21,
              "selection-bold": false,
              "selection-italic": false,
              "selection-code": true,
              "selection-strikethrough": false,
              "selection-siteinfo": false,
              "selection-link": false,
              "linkUrl": "",
            },
            Immutable.Record {
              "start": 21,
              "end": 29,
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
  test.todo(
    "delete last character (caret collapsed) of a selection, surrounding selections have same formats and should merge"
  );
  test("delete last character (caret collapsed) of last selection with formats, model should have 'selections' unset", () => {
    const testModel = nodeModelWithSelections
      .set(
        "content",
        `${testContent.substring(0, 13)}${testContent.substring(14)}`
      )
      .deleteIn(["meta", "selections"])
      .setIn(
        ["meta", "selections"],
        fromJS(
          [
            {
              start: 0,
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
              end: 14,
              "selection-bold": false,
              "selection-italic": false,
              "selection-code": true,
              "selection-strikethrough": false,
              "selection-siteinfo": false,
              "selection-link": false,
              linkUrl: ""
            },
            {
              start: 14,
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
        )
      );
    const updatedModel = adjustSelectionOffsetsAndCleanup(
      testModel,
      testContent,
      14,
      -1
    );
    expect(updatedModel).toMatchInlineSnapshot(`
      Immutable.Map {
        "type": "p",
        "parent_id": "39fb",
        "position": 1,
        "content": "And a second aragraph because",
        "meta": Immutable.Map {},
        "id": "6eda",
        "post_id": 166,
      }
    `);
  });
  test("start or end out of bounds should throw", () => {
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

describe("getSelection", () => {
  test("finds existing Selection, preserves existing formats", () => {
    const testModel = nodeModelWithSelections.set("content", testContent).setIn(
      ["meta", "selections", 4],
      nodeModelWithSelections
        .getIn(["meta", "selections", 4])
        .set(SELECTION_LINK_URL, "http://foo.bar")
        .set(SELECTION_ACTION_LINK, true)
    );
    const testSelection = getSelection(testModel, 13, 22);
    // testModel.getIn(["meta", "selections"]).get(4)
    expect(testSelection).toMatchInlineSnapshot(`
      Immutable.Record {
        "start": 13,
        "end": 22,
        "selection-bold": false,
        "selection-italic": false,
        "selection-code": true,
        "selection-strikethrough": false,
        "selection-siteinfo": false,
        "selection-link": true,
        "linkUrl": "http://foo.bar",
      }
    `);
  });
  test("creates new selection with intersection of overlapping Selection formats applied (no formats)", () => {
    const testModel = nodeModelWithSelections.set("content", testContent);
    const testSelection = getSelection(testModel, 2, 22);
    // testModel.getIn(["meta", "selections"]).get(4)
    expect(testSelection).toMatchInlineSnapshot(`
      Immutable.Record {
        "start": 2,
        "end": 22,
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
  test("creates new selection on paragraph with no selections", () => {
    const testModel = nodeModelWithSelections
      .set("content", testContent)
      .deleteIn(["meta", "selections"]);
    const testSelection = getSelection(testModel, 10, 15);
    // testModel.getIn(["meta", "selections"]).get(4)
    expect(testSelection).toMatchInlineSnapshot(`
      Immutable.Record {
        "start": 10,
        "end": 15,
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
  test("creates new selection with intersection of overlapping Selection formats applied", () => {
    const selections = nodeModelWithSelections.getIn(["meta", "selections"]);
    // will now contain 3 Selections in a row that have SELECTION_ACTION_CODE formats
    const testModel = nodeModelWithSelections
      .set("content", testContent)
      .setIn(
        ["meta", "selections"],
        selections
          .set(2, selections.get(2).set(SELECTION_ACTION_CODE, true))
          .set(3, selections.get(3).set(SELECTION_ACTION_CODE, true))
      );
    const testSelection = getSelection(testModel, 10, 20);
    expect(testSelection).toMatchInlineSnapshot(`
      Immutable.Record {
        "start": 10,
        "end": 20,
        "selection-bold": false,
        "selection-italic": false,
        "selection-code": true,
        "selection-strikethrough": false,
        "selection-siteinfo": false,
        "selection-link": false,
        "linkUrl": "",
      }
    `);
  });
  test("applies formats of outer selection if selection is made within one selection", () => {
    const testModel = nodeModelWithSelections.set("content", testContent);
    const testSelection = getSelection(testModel, 16, 20);
    // testModel.getIn(["meta", "selections"]).get(4)
    expect(testSelection).toMatchInlineSnapshot(`
      Immutable.Record {
        "start": 16,
        "end": 20,
        "selection-bold": false,
        "selection-italic": false,
        "selection-code": true,
        "selection-strikethrough": false,
        "selection-siteinfo": false,
        "selection-link": false,
        "linkUrl": "",
      }
    `);
  });
});

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
  test("new Selection matches existing Selection", () => {
    const testModel = nodeModelWithSelections.set("content", testContent);
    const updatedModel = upsertSelection(
      testModel,
      testModel
        .getIn(["meta", "selections"])
        .get(4)
        .set(SELECTION_ACTION_BOLD, true)
    );
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
              "selection-bold": true,
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
  test("new Selection overlaps existing Selections", () => {
    const testModel = nodeModelWithSelections.set("content", testContent);
    const newSelection = testModel
      .getIn(["meta", "selections", 2])
      .set(SELECTION_ACTION_LINK, true)
      .set(SELECTION_LINK_URL, "http://hot.flakes")
      .set(SELECTION_ACTION_BOLD, true)
      .set(SELECTION_START, 10)
      .set(SELECTION_END, 20);
    const updatedModel = upsertSelection(testModel, newSelection);
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
              "end": 10,
              "selection-bold": false,
              "selection-italic": true,
              "selection-code": false,
              "selection-strikethrough": false,
              "selection-siteinfo": false,
              "selection-link": false,
              "linkUrl": "",
            },
            Immutable.Record {
              "start": 10,
              "end": 20,
              "selection-bold": true,
              "selection-italic": true,
              "selection-code": false,
              "selection-strikethrough": false,
              "selection-siteinfo": false,
              "selection-link": true,
              "linkUrl": "http://hot.flakes",
            },
            Immutable.Record {
              "start": 20,
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
  test.todo("split at the edge of 2 Selections");
  test("split with selections on left and none on right", () => {
    const testModelLeft = fromJS(
      {
        post_id: 166,
        id: "21ba",
        parent_id: "39fb",
        position: 0,
        type: "p",
        content: "Here's a first para",
        meta: {
          selections: [
            {
              start: 0,
              end: 9,
              "selection-bold": false,
              "selection-italic": false,
              "selection-code": false,
              "selection-strikethrough": false,
              "selection-siteinfo": false,
              "selection-link": false,
              linkUrl: ""
            },
            {
              start: 9,
              end: 11,
              "selection-bold": false,
              "selection-italic": true,
              "selection-code": true,
              "selection-strikethrough": false,
              "selection-siteinfo": false,
              "selection-link": false,
              linkUrl: ""
            },
            {
              start: 11,
              end: 32,
              "selection-bold": false,
              "selection-italic": false,
              "selection-code": false,
              "selection-strikethrough": false,
              "selection-siteinfo": false,
              "selection-link": false,
              linkUrl: ""
            }
          ]
        }
      },
      reviver
    );
    const testModelRight = fromJS(
      {
        post_id: 166,
        id: "21bc",
        parent_id: "39fb",
        position: 1,
        type: "p",
        content: "graph because",
        meta: {}
      },
      reviver
    );
    const [left, right] = splitSelectionsAtCaretOffset(
      testModelLeft,
      testModelRight,
      19
    );
    expect(left).toMatchInlineSnapshot(`
      Immutable.Map {
        "post_id": 166,
        "id": "21ba",
        "parent_id": "39fb",
        "position": 0,
        "type": "p",
        "content": "Here's a first para",
        "meta": Immutable.Map {
          "selections": Immutable.List [
            Immutable.Record {
              "start": 0,
              "end": 9,
              "selection-bold": false,
              "selection-italic": false,
              "selection-code": false,
              "selection-strikethrough": false,
              "selection-siteinfo": false,
              "selection-link": false,
              "linkUrl": "",
            },
            Immutable.Record {
              "start": 9,
              "end": 11,
              "selection-bold": false,
              "selection-italic": true,
              "selection-code": true,
              "selection-strikethrough": false,
              "selection-siteinfo": false,
              "selection-link": false,
              "linkUrl": "",
            },
            Immutable.Record {
              "start": 11,
              "end": 19,
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
      }
    `);
    expect(right).toMatchInlineSnapshot(`
      Immutable.Map {
        "post_id": 166,
        "id": "21bc",
        "parent_id": "39fb",
        "position": 1,
        "type": "p",
        "content": "graph because",
        "meta": Immutable.Map {},
      }
    `);
  });
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

describe("formatSelections", () => {
  test("return empty string if argument isn't a List()", () => {
    expect(formatSelections([])).toBe("");
    expect(formatSelections({})).toBe("");
    expect(formatSelections(null)).toBe("");
  });
});
