import { Map, List } from 'immutable';

import HistoryManager, { characterDiffSize } from '../history-manager';
import DocumentModel, { getFirstNode } from '../document-model';
import {
  overrideConsole,
  mockLocalStorage,
} from '../../../common/test-helpers';
import { clearForTests } from '../../../common/local-storage';
import {
  formattedPId,
  h2Id,
  imgId,
  pre2Id,
  testPostWithAllTypesJS,
} from '../../../common/test-post-with-all-types';
import {
  NODE_UPDATE_HISTORY,
  HISTORY_KEY_UNDO,
  HISTORY_KEY_UNDO_ID,
  HISTORY_KEY_UNEXECUTE_OFFSETS,
  HISTORY_KEY_UNEXECUTE_STATES,
  HISTORY_KEY_EXECUTE_OFFSETS,
  HISTORY_KEY_EXECUTE_STATES,
  NODE_TYPE_H1,
} from '../../../common/constants';
import * as api from '../../../common/fetch';

jest.mock('../../../common/fetch', () => ({
  __esModule: true,
  apiPost: jest.fn(async () => ({})),
}));
jest.useFakeTimers();

const { post, contentNodes } = testPostWithAllTypesJS;
const prevSelectionOffsets = { is: 'previousOffsets' };
const selectionOffsets = { is: 'currentOffsets' };

overrideConsole();
mockLocalStorage();
let doc = DocumentModel();
let updateManager = HistoryManager();

beforeEach(() => {
  clearForTests();
  localStorage.clear();
  updateManager = HistoryManager(post.id);
});

describe('HistoryManager', () => {
  test.skip('stageNodeUpdate method', () => {
    updateManager.stageNodeUpdate();
    expect(updateManager[NODE_UPDATE_HISTORY].size).toBe(0);
    updateManager.stageNodeUpdate(null);
    expect(updateManager[NODE_UPDATE_HISTORY].size).toBe(0);
    updateManager.stageNodeUpdate(Map({ id: 'null' }));
    expect(updateManager[NODE_UPDATE_HISTORY].size).toBe(0);
    updateManager.stageNodeUpdate(Map({ id: 'undefined' }));
    expect(updateManager[NODE_UPDATE_HISTORY].size).toBe(0);
    // test that last-write-wins, update overwrites delete
    updateManager.stageNodeDelete(Map({ id: '1234' }));
    updateManager.stageNodeUpdate(Map({ id: '1234' }));
    expect(updateManager[NODE_UPDATE_HISTORY].size).toBe(1);
    expect(updateManager).toMatchSnapshot();
  });
  test.skip('stageNodeDelete method', () => {
    updateManager.stageNodeDelete();
    expect(updateManager[NODE_UPDATE_HISTORY].size).toBe(0);
    updateManager.stageNodeDelete(null);
    expect(updateManager[NODE_UPDATE_HISTORY].size).toBe(0);
    updateManager.stageNodeDelete(Map({ id: 'null' }));
    expect(updateManager[NODE_UPDATE_HISTORY].size).toBe(0);
    updateManager.stageNodeDelete(Map({ id: 'undefined' }));
    expect(updateManager[NODE_UPDATE_HISTORY].size).toBe(0);
    // test that last-write-wins, delete overwrites update
    updateManager.stageNodeUpdate(Map({ id: '1234' }));
    updateManager.stageNodeDelete(Map({ id: '1234' }));
    expect(updateManager).toMatchSnapshot();
  });
  test.skip('addPostIdToUpdates method', () => {
    // mimic a "not-yet-saved" post
    updateManager = HistoryManager(123);
    updateManager.stageNodeUpdate(Map({ id: 'abcd' }));
    expect(
      updateManager[NODE_UPDATE_HISTORY].get('abcd').get('post_id')
    ).toBeUndefined();
    updateManager.addPostIdToUpdates(456);
    expect(updateManager[NODE_UPDATE_HISTORY].get('abcd').get('post_id')).toBe(
      1
    );
  });
  test('clearUpdates method', () => {
    api.apiPost = jest.fn(async () => ({}));
    updateManager.stageNodeUpdate(Map({ id: '1111' }));
    updateManager.stageNodeUpdate(Map({ id: 'abcd' }));
    updateManager.stageNodeDelete(Map({ id: '2222' }));
    updateManager.saveContentBatch();
    expect(api.apiPost).toHaveBeenCalledWith('/content', [
      ['1111', { action: 'update', node: { id: '1111' }, post_id: 175 }],
      ['2222', { action: 'delete', post_id: 175 }],
      ['abcd', { action: 'update', node: { id: 'abcd' }, post_id: 175 }],
    ]);
    api.apiPost.mockClear();
    updateManager.clearUpdates();
    updateManager.saveContentBatch();
    expect(api.apiPost).not.toHaveBeenCalled();
  });
  /**
   * INTEGRATION TESTS - THESE DEPEND ON DocumentModel, or you have to simulate DocumentModel behavior which seems of dubious value
   */
  test.skip('addToUndoHistory - delete a node in the middle', () => {
    doc = DocumentModel(post.id, updateManager, contentNodes);
    const firstNode = getFirstNode(doc.getNodes());
    let prevNodesById = doc.nodesById;
    // create history entry when deleting a node
    doc.delete(doc.getNode(imgId));
    // 1 for the deleted node, 1 for the prev node to update next_sibling_id reference
    expect(updateManager[NODE_UPDATE_HISTORY].size).toBe(2);
    expect(updateManager[HISTORY_KEY_UNDO].size).toBe(0);
    expect(updateManager[NODE_UPDATE_HISTORY]).toMatchSnapshot();
    updateManager.addToUndoHistory(
      prevNodesById,
      prevSelectionOffsets,
      selectionOffsets
    );
    // there should be 1 history entry in the undo stack
    expect(updateManager[HISTORY_KEY_UNDO].size).toBe(1);
    const firstHistory = updateManager[HISTORY_KEY_UNDO].get(0);
    // there should be 2 nodes in the undo
    expect(firstHistory.get(HISTORY_KEY_UNEXECUTE_STATES).size).toBe(2);
    expect(firstHistory.get(HISTORY_KEY_UNEXECUTE_STATES)).toMatchSnapshot();
    expect(firstHistory.get(HISTORY_KEY_UNEXECUTE_OFFSETS)).toBe(
      prevSelectionOffsets
    );
    // and 2 in the redo - they should match the current updates
    expect(firstHistory.get(HISTORY_KEY_EXECUTE_STATES).size).toBe(2);
    expect(firstHistory.get(HISTORY_KEY_EXECUTE_STATES)).toEqual(
      updateManager[NODE_UPDATE_HISTORY]
    );
    expect(firstHistory.get(HISTORY_KEY_EXECUTE_OFFSETS)).toBe(
      selectionOffsets
    );
  });
  test.skip('addToUndoHistory - change a node`s type from P -> H1', () => {
    const doc = DocumentModel(post.id, updateManager, contentNodes);
    const firstNode = getFirstNode(doc.getNodes());
    let prevNodesById = doc.nodesById;
    // create history entry when changing a node's type
    doc.update(
      doc.getNode(formattedPId).set('type', NODE_TYPE_H1).set('meta', Map())
    );
    // 1 for the deleted node, 1 for the prev node to update next_sibling_id reference
    expect(updateManager[NODE_UPDATE_HISTORY].size).toBe(1);
    expect(updateManager[HISTORY_KEY_UNDO].size).toBe(0);
    expect(updateManager[NODE_UPDATE_HISTORY]).toMatchSnapshot();
    updateManager.addToUndoHistory(
      prevNodesById,
      prevSelectionOffsets,
      selectionOffsets
    );
    // there should be 1 history entry in the undo stack
    expect(updateManager[HISTORY_KEY_UNDO].size).toBe(1);
    const firstHistory = updateManager[HISTORY_KEY_UNDO].get(0);
    // there should be 2 nodes in the undo
    expect(firstHistory.get(HISTORY_KEY_UNEXECUTE_STATES).size).toBe(1);
    expect(firstHistory.get(HISTORY_KEY_UNEXECUTE_STATES)).toMatchSnapshot();
    expect(firstHistory.get(HISTORY_KEY_UNEXECUTE_OFFSETS)).toBe(
      prevSelectionOffsets
    );
    // and 2 in the redo - they should match the current updates
    expect(firstHistory.get(HISTORY_KEY_EXECUTE_STATES).size).toBe(1);
    expect(firstHistory.get(HISTORY_KEY_EXECUTE_STATES)).toEqual(
      updateManager[NODE_UPDATE_HISTORY]
    );
    expect(firstHistory.get(HISTORY_KEY_EXECUTE_OFFSETS)).toBe(
      selectionOffsets
    );
  });
  test.skip('addToUndoHistory - simulate typing inside content field of one node, add to history when characterDiffSize threshold is met', () => {
    doc = DocumentModel(post.id, updateManager, contentNodes);
    const firstNode = getFirstNode(doc.getNodes());
    let prevNodesById = doc.getNodes();
    const newContent = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ'.substring(
      0,
      characterDiffSize + 1
    );
    // loop over the string, adding one char at a time to simulate typing
    for (let i = 0; i < newContent.length - 1; i++) {
      doc.update(
        doc
          .getNode(h2Id)
          .set(
            'content',
            `${doc.getNode(h2Id).get('content')}${newContent.charAt(i)}`
          )
      );
      // since updates are keyed off of nodeId, there will only be 1 update
      expect(updateManager[NODE_UPDATE_HISTORY].size).toBe(1);
      expect(updateManager[HISTORY_KEY_UNDO].size).toBe(0);
      updateManager.addToUndoHistory(
        prevNodesById,
        i === 0 ? prevSelectionOffsets : { is: `wrongOffsets${i}` },
        selectionOffsets
      );
      // there shouldn't a history entry until we reach the change threshold after the loop
      expect(updateManager[HISTORY_KEY_UNDO].size).toBe(0);
    }
    doc.update(
      doc
        .getNode(h2Id)
        .set(
          'content',
          `${doc.getNode(h2Id).get('content')}${newContent.charAt(
            newContent.length - 1
          )}`
        )
    );
    // since updates are keyed off of nodeId, there will only be 1 update
    expect(updateManager[NODE_UPDATE_HISTORY].size).toBe(1);
    expect(updateManager[NODE_UPDATE_HISTORY]).toMatchSnapshot();
    expect(updateManager[HISTORY_KEY_UNDO].size).toBe(0);
    updateManager.addToUndoHistory(
      prevNodesById,
      { is: `wrongOffsets${newContent.length - 1}` },
      selectionOffsets
    );
    // we should have hit the threshold now
    expect(updateManager[HISTORY_KEY_UNDO].size).toBe(1);
    const firstHistory = updateManager[HISTORY_KEY_UNDO].get(0);
    expect(firstHistory.get(HISTORY_KEY_UNEXECUTE_STATES).size).toBe(1);
    expect(firstHistory.get(HISTORY_KEY_UNEXECUTE_STATES)).toMatchSnapshot();
    expect(firstHistory.get(HISTORY_KEY_UNEXECUTE_OFFSETS)).toBe(
      prevSelectionOffsets
    );
    expect(firstHistory.get(HISTORY_KEY_EXECUTE_STATES).size).toBe(1);
    expect(firstHistory.get(HISTORY_KEY_EXECUTE_STATES)).toEqual(
      updateManager[NODE_UPDATE_HISTORY]
    );
    expect(firstHistory.get(HISTORY_KEY_EXECUTE_OFFSETS)).toBe(
      selectionOffsets
    );
  });
  test.todo(
    'addToUndoHistory - simulate select and type inside content field of one node'
  );
  test.todo('addToUndoHistory - simulate select and type across nodes');
  test('undo / redo', () => {
    doc = DocumentModel(post.id, updateManager, contentNodes);
    const prevNodesById = doc.getNodes();
    const h2 = doc.getNode(h2Id);
    const img = doc.getNode(imgId);
    // create updates that will go into undo history
    // content change beyond threshold
    doc.update(h2.set('content', 'foo'));
    // structural change
    doc.deleteNode(img);
    expect(doc.getNode(h2Id).get('content')).toBe('foo');
    expect(doc.getNode(imgId)).toEqual(Map());
    const updatedNodesById = doc.getNodes();
    // simulate "EditPage->commit()"
    updateManager.addToUndoHistory(
      prevNodesById,
      prevSelectionOffsets,
      selectionOffsets
    );
    // apply undo
    const undoNodesAndOffsets = updateManager.undo(doc.getNodes());
    // the most recent redo update should equal previous undo as it was just "moved over"
    expect(undoNodesAndOffsets.get('nodesById')).toEqual(prevNodesById);
    // apply redo
    const redoNodesAndOffsets = updateManager.redo(doc.getNodes());
    expect(redoNodesAndOffsets.get('nodesById')).toEqual(updatedNodesById);
  });
  test('saveContentBatch', async () => {
    // empty updates should not make API call
    await updateManager.saveContentBatch();
    expect(api.apiPost).not.toHaveBeenCalled();
    // stage some updates
    updateManager.stageNodeUpdate(Map({ id: '1111' }));
    updateManager.stageNodeUpdate(Map({ id: 'abcd' }));
    updateManager.stageNodeDelete(Map({ id: '2222' }));
    // test api failure - updates should remain
    api.apiPost = jest.fn(async () => ({ error: true }));
    await updateManager.saveContentBatch();
    const updates = [
      ['1111', { action: 'update', node: { id: '1111' }, post_id: 175 }],
      ['2222', { action: 'delete', post_id: 175 }],
      ['abcd', { action: 'update', node: { id: 'abcd' }, post_id: 175 }],
    ];
    expect(api.apiPost).toHaveBeenCalledWith('/content', updates);
    // test api success - updates are cleared
    api.apiPost = jest.fn(async () => ({}));
    await updateManager.saveContentBatch();
    expect(api.apiPost).toHaveBeenCalledWith('/content', updates);
    await updateManager.saveContentBatch();
    expect(api.apiPost).not.toHaveBeenCalledWith();
  });
  test('saveContentDebounce', () => {
    api.apiPost = jest.fn(async () => ({}));
    updateManager.stageNodeUpdate(Map({ id: '1111' }));
    updateManager.saveContentBatchDebounce();
    updateManager.saveContentBatchDebounce();
    updateManager.saveContentBatchDebounce();
    jest.runAllTimers();
    expect(api.apiPost).toHaveBeenCalledTimes(1);
  });
});
