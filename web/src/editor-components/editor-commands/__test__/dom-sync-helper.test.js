import { overrideConsole } from '../../../common/test-helpers';
import * as utils from '../../../common/utils';

import DocumentModel from '@filbert/document/document-model';
import * as selectionHelpers from '@filbert/selection';
import { syncToDom, syncFromDom } from '../dom-sync';

import {
  testPostWithAllTypesJS,
  h2Id,
  h2Content,
} from '@filbert/util/test-post-with-all-types';
const { post, contentNodes } = testPostWithAllTypesJS;
overrideConsole();
let doc;
const spyGetChar = jest
  .spyOn(utils, 'getCharFromEvent')
  .mockImplementation((arg) => arg);
const spyAdjust = jest
  .spyOn(selectionHelpers, 'adjustSelectionOffsetsAndCleanup')
  .mockImplementation((...args) => args[0]);

beforeEach(() => {
  jest.clearAllMocks();
  doc = DocumentModel(post.id, contentNodes);
});

describe('Document Model -> DOM sync helper', () => {
  test('syncToDom - validates input', () => {
    expect(() => {
      syncToDom(doc, { startNodeId: null }, {});
    }).toThrow();
    expect(spyGetChar).not.toHaveBeenCalled();
  });
  test('syncToDom - adds a new letter to content at caretStart', () => {
    const offset = 6;
    const newChar = 'Z';
    const contentBeforeUpdate = doc.getNode(h2Id).content;
    const {
      historyState,
      executeSelectionOffsets: { startNodeId, caretStart },
    } = syncToDom(doc, { startNodeId: h2Id, caretStart: offset }, newChar);
    expect(spyGetChar).toHaveBeenCalledWith(newChar);
    expect(spyAdjust).toHaveBeenCalledWith(
      doc.getNode(h2Id),
      contentBeforeUpdate,
      offset,
      newChar.length
    );
    expect(startNodeId).toBe(h2Id);
    expect(caretStart).toBe(offset + newChar.length);
    expect(historyState).toMatchSnapshot();
    expect(doc.getNode(h2Id).content).toBe(
      `${h2Content.slice(0, offset)}${newChar}${h2Content.slice(offset)}`
    );
  });
  test('syncToDom - adds a new letter to empty content', () => {
    const offset = 0;
    const newChar = 'Z';
    // unset content
    doc.update(doc.getNode(h2Id).set('content', ''));
    const contentBeforeUpdate = doc.getNode(h2Id).content;
    const {
      historyState,
      executeSelectionOffsets: { startNodeId, caretStart },
    } = syncToDom(doc, { startNodeId: h2Id, caretStart: offset }, newChar);
    expect(spyGetChar).toHaveBeenCalledWith(newChar);
    expect(spyAdjust).toHaveBeenCalledWith(
      doc.getNode(h2Id),
      contentBeforeUpdate,
      offset,
      newChar.length
    );
    expect(startNodeId).toBe(h2Id);
    expect(caretStart).toBe(offset + newChar.length);
    expect(historyState).toMatchSnapshot();
    expect(doc.getNode(h2Id).content).toBe(
      `${contentBeforeUpdate.slice(
        0,
        offset
      )}${newChar}${contentBeforeUpdate.slice(offset)}`
    );
  });
  test('syncToDom - warns if new content length > 1', () => {
    const offset = 10;
    // adding more than one char at a time should work but, we shouldn't
    // arrive here (paste is handled another way)
    const newChar = 'way too much content';
    const contentBeforeUpdate = doc.getNode(h2Id).content;
    const {
      historyState,
      executeSelectionOffsets: { startNodeId, caretStart },
    } = syncToDom(doc, { startNodeId: h2Id, caretStart: offset }, newChar);
    expect(console.warn).toHaveBeenCalled();
    expect(spyGetChar).toHaveBeenCalledWith(newChar);
    expect(spyAdjust).toHaveBeenCalledWith(
      doc.getNode(h2Id),
      contentBeforeUpdate,
      offset,
      newChar.length
    );
    expect(startNodeId).toBe(h2Id);
    expect(caretStart).toBe(offset + newChar.length);
    expect(historyState).toMatchSnapshot();
    expect(doc.getNode(h2Id).content).toBe(
      `${h2Content.slice(0, offset)}${newChar}${h2Content.slice(offset)}`
    );
  });
  test('syncFromDom - validates input', () => {
    // bad startNodeId
    expect(() => {
      syncFromDom(doc, { startNodeId: null }, {});
    }).toThrow();
    // emojis only: only syncs events with a 'data' property
    const result = syncFromDom(
      doc,
      { startNodeId: h2Id },
      { fortSumpter: 'sumpPump' }
    );
    expect(result).toEqual({});
  });
  test('syncFromDom - adds an emoji 😀 to content at caretStart', () => {
    const emojiEvent = { data: '🤦🏻‍♂️' };
    // offset will be the position AFTER the emoji that's been inserted
    const offset = 10 + emojiEvent.data.length;
    const contentBeforeUpdate = doc.getNode(h2Id).content;
    const {
      historyState,
      executeSelectionOffsets: { startNodeId, caretStart },
    } = syncFromDom(doc, { startNodeId: h2Id, caretStart: offset }, emojiEvent);
    expect(spyAdjust).toHaveBeenCalledWith(
      doc.getNode(h2Id),
      contentBeforeUpdate,
      offset - emojiEvent.data.length,
      emojiEvent.data.length
    );
    expect(startNodeId).toBe(h2Id);
    expect(caretStart).toBe(offset);
    expect(historyState).toMatchSnapshot();
    expect(doc.getNode(h2Id).content).toBe(
      `${h2Content.slice(0, offset - emojiEvent.data.length)}${
        emojiEvent.data
      }${h2Content.slice(offset - emojiEvent.data.length)}`
    );
  });
  test('syncFromDom - adds an emoji 😀 to empty content', () => {
    const emojiEvent = { data: '🤦🏻‍♂️' };
    // offset will be the position AFTER the emoji that's been inserted
    const offset = emojiEvent.data.length;
    doc.update(doc.getNode(h2Id).set('content', ''));
    const contentBeforeUpdate = doc.getNode(h2Id).content;
    const {
      historyState,
      executeSelectionOffsets: { startNodeId, caretStart },
    } = syncFromDom(doc, { startNodeId: h2Id, caretStart: offset }, emojiEvent);
    expect(spyAdjust).toHaveBeenCalledWith(
      doc.getNode(h2Id),
      contentBeforeUpdate,
      offset - emojiEvent.data.length,
      emojiEvent.data.length
    );
    expect(startNodeId).toBe(h2Id);
    expect(caretStart).toBe(offset);
    expect(historyState).toMatchSnapshot();
    expect(doc.getNode(h2Id).content).toBe(
      `${contentBeforeUpdate.slice(0, offset - emojiEvent.data.length)}${
        emojiEvent.data
      }${contentBeforeUpdate.slice(offset - emojiEvent.data.length)}`
    );
  });
});
