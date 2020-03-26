import { overrideConsole } from '../../../../common/test-helpers';
import * as selectionHelpers from '../../selection-helpers';
import * as handleTextType from '../handle-text-type';
import DocumentModel from '../../document-model';
import {
  firstNodeContent,
  firstNodeIdH1,
  formattedLiId,
  formattedPContent,
  formattedPId,
  h2Id,
  imgId,
  lastNodeContent,
  lastNodeIdP,
  pre2Id,
  testPostWithAllTypesJS
} from '../../../../common/test-post-with-all-types';
import { doDelete } from '../delete';

overrideConsole();
const { post, contentNodes } = testPostWithAllTypesJS;
const doc = new DocumentModel();

let originalNodeCount;
let spyAdjust;
let spyBackspace;

beforeEach(() => {
  spyAdjust = jest
    .spyOn(selectionHelpers, 'adjustSelectionOffsetsAndCleanup')
    .mockImplementation((...args) => args[0]);
  spyBackspace = jest
    .spyOn(handleTextType, 'handleBackspaceTextType')
    .mockImplementation(() => ({}));
  doc.init(
    post,
    { stageNodeUpdate: jest.fn(), stageNodeDelete: jest.fn() },
    contentNodes
  );
  originalNodeCount = doc.nodesById.size;
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
    const originalNode = doc.getNode(formattedPId);
    const contentAfterDelete = formattedPContent.slice(0, 16);
    const { startNodeId, caretStart } = doDelete(doc, {
      startNodeId: formattedPId,
      caretStart: 16,
      caretEnd: formattedPContent.length
    });
    expect(startNodeId).toBe(formattedPId);
    expect(caretStart).toBe(16);
    expect(doc.getNode(formattedPId).get('content')).toEqual(
      contentAfterDelete
    );
    expect(spyAdjust).toHaveBeenCalledWith(
      originalNode.set('content', contentAfterDelete),
      formattedPContent,
      formattedPContent.length,
      -18
    );
  });
  test('doDelete - deletes a Meta Type node', () => {
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
  test('doDelete - deletes all content - should merge with TextType', () => {
    doDelete(doc, {
      startNodeId: formattedLiId,
      caretStart: 0,
      caretEnd: 0
    });
    expect(spyAdjust).not.toHaveBeenCalled();
    expect(spyBackspace).toHaveBeenCalledWith(doc, formattedLiId);
  });
  test('doDelete - deletes across nodes - merges TextTypes', () => {
    doDelete(doc, {
      startNodeId: h2Id,
      caretStart: 6,
      endNodeId: pre2Id,
      caretEnd: 3
    });
    // 1 for h2 and 1 for pre
    expect(spyAdjust).toHaveBeenCalledTimes(2);
    expect(spyBackspace).toHaveBeenCalledWith(doc, pre2Id);
    // IRL should have deleted 8 nodes but, in this test we
    // should have deleted 7 nodes: 0 (because we mocked handleBackspaceTextType()
    // which does the merge) for the pre (endNode) and 7 in between
    expect(originalNodeCount - doc.nodesById.size).toEqual(7);
  });
  test('doDelete - deletes across nodes - from end of one TextType through another TextType', () => {
    doDelete(doc, {
      startNodeId: firstNodeIdH1,
      caretStart: firstNodeContent.length,
      endNodeId: formattedPId,
      caretEnd: formattedPContent.length
    });
    expect(spyAdjust).not.toHaveBeenCalled();
    expect(spyBackspace).toHaveBeenCalledWith(doc, firstNodeIdH1);
    // again IRL this will be 3 because of mock handleBackspaceTextType()
    expect(originalNodeCount - doc.nodesById.size).toEqual(2);
  });
  test.todo('doDelete - deletes across nodes - from Meta ends on Text');
  test.todo('doDelete - deletes across nodes - all Meta Nodes');
  test('doDelete - deletes across nodes - all Nodes in document', () => {
    const { startNodeId, caretStart } = doDelete(doc, {
      startNodeId: firstNodeIdH1,
      endNodeId: lastNodeIdP,
      caretStart: 0,
      caretEnd: lastNodeContent.length
    });
    expect(startNodeId).not.toBe(firstNodeIdH1);
    expect(caretStart).toBe(-1);
    expect(doc.nodesById.size).toBe(1);
    expect(spyAdjust).not.toHaveBeenCalled();
  });
});
