import { overrideConsole } from '../../../../common/test-helpers';
import * as selectionHelpers from '../../selection-helpers';
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
  preId,
  spacerId,
  testPostWithAllTypesJS,
} from '../../../../common/test-post-with-all-types';
import { doDelete } from '../delete';

overrideConsole();
const { post, contentNodes } = testPostWithAllTypesJS;
let doc = DocumentModel();

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
  doc = DocumentModel(
    post.id,
    { stageNodeUpdate: jest.fn(), stageNodeDelete: jest.fn() },
    contentNodes
  );
  originalNodeCount = doc.getNodes().size;
});

describe.skip('Document Model -> Delete helper - single node', () => {
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
      caretEnd: 5,
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
      caretEnd: 6,
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
      caretEnd: 15,
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
      caretEnd: formattedPContent.length,
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
      caretEnd: 0,
    });
    expect(startNodeId).toBe(pre2Id);
    expect(caretStart).toBe(-1);
    expect(spyAdjust).not.toHaveBeenCalled();
  });
});
describe.skip('Document Model -> Delete helper - across nodes', () => {
  // is this desired behavior?
  test('doDelete - deletes all content - should merge with TextType', () => {
    doDelete(doc, {
      startNodeId: formattedLiId,
      caretStart: 0,
      caretEnd: 0,
    });
    expect(spyAdjust).not.toHaveBeenCalled();
    expect(spyBackspace).toHaveBeenCalledWith(doc, formattedLiId);
  });
  test('doDelete - deletes across nodes - merges TextTypes', () => {
    doDelete(doc, {
      startNodeId: h2Id,
      caretStart: 6,
      endNodeId: pre2Id,
      caretEnd: 3,
    });
    // 1 for h2 and 1 for pre
    expect(spyAdjust).toHaveBeenCalledTimes(2);
    expect(spyBackspace).toHaveBeenCalledWith(doc, pre2Id);
    // IRL should have deleted 8 nodes but, in this test we
    // should have deleted 7 nodes: 0 (because we mocked handleBackspaceTextType()
    // which does the merge) for the pre (endNode) and 7 in between
    expect(originalNodeCount - doc.getNodes().size).toEqual(7);
  });
  test('doDelete - deletes across nodes - from end of one TextType through end of another TextType', () => {
    doDelete(doc, {
      startNodeId: firstNodeIdH1,
      caretStart: firstNodeContent.length,
      endNodeId: formattedPId,
      caretEnd: formattedPContent.length,
    });
    expect(spyAdjust).not.toHaveBeenCalled();
    expect(spyBackspace).not.toHaveBeenCalledWith(doc, firstNodeIdH1);
    // again IRL this will be 3 because of mock handleBackspaceTextType()
    expect(originalNodeCount - doc.getNodes().size).toEqual(2);
  });
  test.todo('doDelete - deletes across nodes - from Meta ends on Text');
  test.todo('doDelete - deletes across nodes - all Meta Nodes');
  test('doDelete - deletes across nodes - all Nodes in document', () => {
    const { startNodeId, caretStart } = doDelete(doc, {
      startNodeId: firstNodeIdH1,
      endNodeId: lastNodeIdP,
      caretStart: 0,
      caretEnd: lastNodeContent.length,
    });
    expect(startNodeId).not.toBe(firstNodeIdH1);
    expect(caretStart).toBe(-1);
    expect(doc.getNodes().size).toBe(1);
    expect(spyAdjust).not.toHaveBeenCalled();
  });
  // TODO: keep these?
  test('handleBackspaceTextType - noop if selectedNodeId is first node in document', () => {
    const { startNodeId } = handleBackspaceTextType(doc, firstNodeIdH1);
    expect(startNodeId).toBe(firstNodeIdH1);
  });
  test('handleBackspaceTextType - deletes an empty Text Type node if previous node is a Meta Type', () => {
    doc.update(doc.getNode(h2Id).set('content', ''));
    const { startNodeId, caretStart } = handleBackspaceTextType(doc, h2Id);
    expect(startNodeId).toBe(spacerId);
    expect(caretStart).toBe(0);
    expect(doc.getNode(h2Id).size).toBe(0);
  });
  test('handleBackspaceTextType - merges content of two Text Type nodes', () => {
    const spy = jest.spyOn(doc, 'mergeParagraphs').mockImplementation(() => {});
    const { startNodeId, caretStart } = handleBackspaceTextType(doc, preId);
    expect(spy).toHaveBeenCalledWith(formattedLiId, preId);
    expect(startNodeId).toBe(formattedLiId);
    expect(caretStart).toEqual(
      doc.getNode(formattedLiId).get('content').length
    );
  });
});
