import { overrideConsole } from '../../../../common/test-helpers';
import * as selectionHelpers from '../../selection-helpers';
import DocumentModel from '../../document-model';
import {
  firstNodeContent,
  firstNodeIdH1,
  formattedPContent,
  formattedPId,
  imgId,
  pre2Id,
  testPostWithAllTypesJS
} from '../../test/test-post-with-all-types';
import { doDelete } from '../delete';

overrideConsole();
const { post, contentNodes } = testPostWithAllTypesJS;
const doc = new DocumentModel();

beforeEach(() => {
  doc.init(
    post,
    { stageNodeUpdate: jest.fn(), stageNodeDelete: jest.fn() },
    contentNodes
  );
});

describe('Document Model -> Delete helper - single node', () => {
  test('doDelete - validates minimum input of startNodeId', () => {
    let result = doDelete(doc, { startNodeId: null });
    expect(result).toEqual({});
    expect(console.warn).toHaveBeenCalledTimes(1);
    result = doDelete(doc, {});
    expect(result).toEqual({});
    expect(console.warn).toHaveBeenCalledTimes(2);
  });
  test('doDelete - deletes one character somewhere in middle - caret collapsed', () => {
    const { startNodeId, caretStart } = doDelete(doc, {
      startNodeId: firstNodeIdH1,
      caretStart: 5,
      caretEnd: 5
    });
    expect(startNodeId).toBe(firstNodeIdH1);
    expect(caretStart).toBe(4);
    expect(doc.getNode(firstNodeIdH1).get('content')).toEqual(
      `${firstNodeContent.slice(0, 4)}${firstNodeContent.slice(5)}`
    );
  });
  test('doDelete - deletes one character - selection', () => {
    const { startNodeId, caretStart } = doDelete(doc, {
      startNodeId: firstNodeIdH1,
      caretStart: 5,
      caretEnd: 6
    });
    expect(startNodeId).toBe(firstNodeIdH1);
    expect(caretStart).toBe(5);
    expect(doc.getNode(firstNodeIdH1).get('content')).toEqual(
      `${firstNodeContent.slice(0, 5)}${firstNodeContent.slice(6)}`
    );
  });
  test('doDelete - deletes selection from beginning', () => {
    const spyAdjust = jest
      .spyOn(selectionHelpers, 'adjustSelectionOffsetsAndCleanup')
      .mockImplementation((...args) => args[0]);
    const originalNode = doc.getNode(formattedPId);
    const contentAfterDelete = formattedPContent.slice(15);
    const { startNodeId, caretStart } = doDelete(doc, {
      startNodeId: formattedPId,
      caretStart: 0,
      caretEnd: 15
    });
    expect(startNodeId).toBe(formattedPId);
    expect(caretStart).toBe(0);
    expect(doc.getNode(formattedPId).get('content')).toEqual(
      contentAfterDelete
    );
    expect(spyAdjust).toHaveBeenCalledWith(
      originalNode.set('content', contentAfterDelete),
      formattedPContent,
      15,
      -15
    );
  });
  test('doDelete - deletes selection through end', () => {
    const spyAdjust = jest
      .spyOn(selectionHelpers, 'adjustSelectionOffsetsAndCleanup')
      .mockImplementation((...args) => args[0]);
    const originalNode = doc.getNode(formattedPId);
    const contentAfterDelete = formattedPContent.slice(0, 16);
    const { startNodeId, caretStart } = doDelete(doc, {
      startNodeId: formattedPId,
      caretStart: 16,
      caretEnd: 34
    });
    expect(startNodeId).toBe(formattedPId);
    expect(caretStart).toBe(16);
    expect(doc.getNode(formattedPId).get('content')).toEqual(
      contentAfterDelete
    );
    expect(spyAdjust).toHaveBeenCalledWith(
      originalNode.set('content', contentAfterDelete),
      formattedPContent,
      34,
      -18
    );
  });
  test('doDelete - deletes a Meta Type node', () => {
    const spyAdjust = jest
      .spyOn(selectionHelpers, 'adjustSelectionOffsetsAndCleanup')
      .mockImplementation((...args) => args[0]);
    const { startNodeId, caretStart } = doDelete(doc, {
      startNodeId: imgId,
      caretStart: 0,
      caretEnd: 0
    });
    expect(startNodeId).toBe(pre2Id);
    expect(caretStart).toBe(-1);
    expect(spyAdjust).not.toHaveBeenCalled();
  });
});
describe('Document Model -> Delete helper - across nodes', () => {
  // is this desired behavior?
  test.todo('doDelete - deletes all content - should merge with TextType');
  test.todo('doDelete - deletes across nodes - merges TextTypes');
  test.todo('doDelete - deletes across nodes - starts on TextType end on Meta');
  test.todo('doDelete - deletes across nodes - starts on Meta ends on Text');
  test.todo('doDelete - deletes across nodes - all Meta Nodes');
});
