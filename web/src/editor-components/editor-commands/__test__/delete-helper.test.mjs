import { jest } from '@jest/globals';
import {
  firstNodeContent,
  firstNodeIdH1,
  formattedLiId,
  formattedLiIdPrev,
  formattedLiIdPrevContent,
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
} from '@filbert/selection';
import { DocumentModel } from '@filbert/document';
import { HistoryManager } from '@filbert/history';
import {
  doDeleteSingleNode,
  doDeleteSingleNodeBackspace,
  doDeleteMultiNode,
  doDeleteMultiNodeBackspace,
} from '../delete.mjs';

const { post, head, nodes } = testPostWithAllTypesJS;
let doc;
let hist;
const mockApiClient = { post: jest.fn() };

let originalNodeCount;
let spyAdjust;

beforeAll(() => {
  console.debug = () => {};
  console.info = () => {};
  console.log = () => {};
});

beforeEach(() => {
  doc = DocumentModel.fromJS(post.id, head, nodes);
  hist = HistoryManager(post.id, mockApiClient);
  originalNodeCount = doc.size;
});

describe('doDeleteSingleNode', () => {
  test('returns undefined on a collapsed caret', () => {
    expect(
      doDeleteSingleNode(doc, hist, { startNodeId: preId, caretStart: 5 })
    ).toBe(undefined);
  });
  test('deletes a Meta Type node', () => {
    expect(
      doDeleteSingleNode(doc, hist, {
        startNodeId: imgId,
        caretStart: 0,
        caretEnd: 0,
      })
    ).toBe(undefined);
  });
});

describe('doDeleteSingleNodeBackspace', () => {
  test('doDelete - deletes one character somewhere in middle - caret collapsed', () => {
    const {
      historyState,
      selectionOffsets: { startNodeId, caretStart },
    } = doDeleteSingleNodeBackspace(doc, hist, {
      startNodeId: firstNodeIdH1,
      caretStart: 5,
      caretEnd: 5,
    });
    expect(startNodeId).toBe(firstNodeIdH1);
    expect(caretStart).toBe(4);
    expect(historyState).toEqual();
    expect(doc.getNode(firstNodeIdH1).content).toEqual(
      `${firstNodeContent.slice(0, 4)}${firstNodeContent.slice(5)}`
    );
  });
  test('doDelete - deletes one character - selection', () => {
    const {
      historyState,
      selectionOffsets: { startNodeId, caretStart },
    } = doDelete(doc, {
      startNodeId: firstNodeIdH1,
      caretStart: 5,
      caretEnd: 6,
    });
    expect(startNodeId).toBe(firstNodeIdH1);
    expect(caretStart).toBe(5);
    expect(historyState).toMatchSnapshot();
    expect(doc.getNode(firstNodeIdH1).content).toEqual(
      `${firstNodeContent.slice(0, 5)}${firstNodeContent.slice(6)}`
    );
  });
  test('doDelete - deletes selection from beginning', () => {
    const originalNode = doc.getNode(formattedPId);
    const contentAfterDelete = formattedPContent.slice(15);
    const {
      historyState,
      selectionOffsets: { startNodeId, caretStart },
    } = doDelete(doc, {
      startNodeId: formattedPId,
      caretStart: 0,
      caretEnd: 15,
    });
    expect(startNodeId).toBe(formattedPId);
    expect(caretStart).toBe(0);
    expect(historyState).toMatchSnapshot();
    expect(doc.getNode(formattedPId).content).toEqual(contentAfterDelete);
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
    const {
      historyState,
      selectionOffsets: { startNodeId, caretStart },
    } = doDelete(doc, {
      startNodeId: formattedPId,
      caretStart: 16,
      caretEnd: formattedPContent.length,
    });
    expect(startNodeId).toBe(formattedPId);
    expect(caretStart).toBe(16);
    expect(historyState).toMatchSnapshot();
    expect(doc.getNode(formattedPId).content).toEqual(contentAfterDelete);
    expect(spyAdjust).toHaveBeenCalledWith(
      originalNode.set('content', contentAfterDelete),
      formattedPContent,
      formattedPContent.length,
      -18
    );
  });
});
describe('Document Model -> Delete helper - across nodes', () => {
  test('doDelete - deletes across nodes', () => {
    const {
      historyState,
      selectionOffsets: { startNodeId, caretStart },
    } = doDelete(doc, {
      startNodeId: h2Id,
      caretStart: 6,
      endNodeId: pre2Id,
      caretEnd: 3,
    });
    // 1 for h2 and 1 for pre
    expect(spyAdjust).toHaveBeenCalledTimes(2);
    expect(startNodeId).toBe(pre2Id);
    expect(caretStart).toBe(0);
    expect(historyState).toMatchSnapshot();
    // Update: since doDelete() and doMerge() are separate operations, this still holds true
    // IRL should have deleted 8 nodes but, in this test we
    // should have deleted 7 nodes: 0 (because we mocked handleBackspaceTextType()
    // which does the merge) for the pre (endNode) and 7 in between
    expect(originalNodeCount - doc.getNodes().size).toEqual(7);
  });
  test('doDelete - deletes across nodes - from end of one TextType through end of another TextType', () => {
    const {
      historyState,
      selectionOffsets: { startNodeId, caretStart },
    } = doDelete(doc, {
      startNodeId: firstNodeIdH1,
      caretStart: firstNodeContent.length,
      endNodeId: formattedPId,
      caretEnd: formattedPContent.length,
    });
    expect(spyAdjust).toHaveBeenCalledTimes(2);
    expect(startNodeId).toBe(firstNodeIdH1);
    expect(caretStart).toBe(12);
    expect(historyState).toMatchSnapshot();
    // should fully delete only `formattedPId`
    expect(originalNodeCount - doc.getNodes().size).toEqual(1);
  });
  test.todo('doDelete - deletes across nodes - from Meta ends on Text');
  test.todo('doDelete - deletes across nodes - all Meta Nodes');
  test('doDelete - deletes across nodes - all Nodes in document', () => {
    const {
      historyState,
      selectionOffsets: { startNodeId, caretStart },
    } = doDelete(doc, {
      startNodeId: firstNodeIdH1,
      endNodeId: lastNodeIdP,
      caretStart: 0,
      caretEnd: lastNodeContent.length,
    });
    expect(startNodeId).not.toBe(firstNodeIdH1);
    expect(caretStart).toBe(0);
    expect(historyState).toMatchSnapshot();
    // NOTE: 2 nodes are left by design - the first and the last.
    // doMerge() will then be called to merge the last into the first to complete the operation
    expect(spyAdjust).toHaveBeenCalledTimes(2);
    expect(doc.getNodes().size).toBe(2);
  });
  test('noop if selectedNodeId is first node in document', () => {
    const {
      historyState,
      selectionOffsets: { startNodeId, caretStart },
    } = doDelete(doc, { startNodeId: firstNodeIdH1, caretStart: 0 });
    expect(startNodeId).toBe(firstNodeIdH1);
    expect(caretStart).toBe(0);
    expect(historyState).toMatchSnapshot();
  });
});

describe('doMerge', () => {
  test('merges LI -> LI', () => {
    const {
      historyState,
      selectionOffsets: { startNodeId, caretStart },
    } = doMerge(doc, {
      startNodeId: formattedLiId,
      caretStart: 0,
      caretEnd: 0,
    });
    expect(startNodeId).toBe(formattedLiIdPrev);
    expect(caretStart).toBe(formattedLiIdPrevContent.length);
    expect(historyState).toMatchSnapshot();
    expect(originalNodeCount - doc.getNodes().size).toEqual(1);
  });
  test('merges content of two Text Type nodes', () => {
    const spy = jest.spyOn(doc, 'mergeParagraphs').mockImplementation(() => []);
    const {
      historyState,
      selectionOffsets: { startNodeId, caretStart },
    } = doMerge(doc, { startNodeId: preId, caretStart: 0 });
    expect(spy).toHaveBeenCalledWith(formattedLiId, preId);
    expect(startNodeId).toBe(formattedLiId);
    expect(caretStart).toEqual(doc.getNode(formattedLiId).content.length);
    expect(historyState).toEqual([]); // from mock
  });
  test('deletes an empty Text Type node if previous node is a Meta Type', () => {
    doc.update(doc.getNode(h2Id).set('content', ''));
    const {
      historyState,
      selectionOffsets: { startNodeId, caretStart },
    } = doMerge(doc, { startNodeId: h2Id, caretStart: 0 });
    expect(startNodeId).toBe(spacerId);
    expect(caretStart).toBe(0);
    expect(historyState).toMatchSnapshot();
    expect(doc.getNode(h2Id).size).toBe(0);
    expect(originalNodeCount - doc.getNodes().size).toEqual(1);
  });
});
