import { Map, List } from 'immutable';

import UpdateManager, { characterDiffSize } from '../update-manager';
import DocumentModel from '../document-model';
import {
  overrideConsole,
  mockLocalStorage
} from '../../../common/test-helpers';
import { clearForTests } from '../../../common/local-storage';
import {
  formattedPId,
  h2Id,
  imgId,
  pre2Id,
  testPostWithAllTypesJS
} from './test-post-with-all-types';
import {
  HISTORY_KEY_NODE_UPDATES,
  HISTORY_KEY_UNDO,
  HISTORY_KEY_REDO,
  HISTORY_KEY_UNDO_OFFSETS,
  HISTORY_KEY_UNDO_UPDATES,
  HISTORY_KEY_REDO_OFFSETS,
  HISTORY_KEY_REDO_UPDATES,
  NODE_TYPE_H1
} from '../../../common/constants';
import * as api from '../../../common/fetch';

jest.mock('../../../common/fetch', () => ({
  __esModule: true,
  apiPost: jest.fn(async () => ({}))
}));
jest.useFakeTimers();

const { post, contentNodes } = testPostWithAllTypesJS;

overrideConsole();
mockLocalStorage();
let updateManager;

beforeEach(() => {
  clearForTests();
  localStorage.clear();
  updateManager = new UpdateManager();
  updateManager.init(post);
});

describe('UpdateManager', () => {
  test('init method', () => {
    expect(updateManager).toMatchSnapshot();
  });
  test('stageNodeUpdate method', () => {
    updateManager.stageNodeUpdate();
    expect(updateManager[HISTORY_KEY_NODE_UPDATES].size).toBe(0);
    updateManager.stageNodeUpdate(null);
    expect(updateManager[HISTORY_KEY_NODE_UPDATES].size).toBe(0);
    updateManager.stageNodeUpdate(Map({ id: 'null' }));
    expect(updateManager[HISTORY_KEY_NODE_UPDATES].size).toBe(0);
    updateManager.stageNodeUpdate(Map({ id: 'undefined' }));
    expect(updateManager[HISTORY_KEY_NODE_UPDATES].size).toBe(0);
    // test that last-write-wins, update overwrites delete
    updateManager.stageNodeDelete(Map({ id: '1234' }));
    updateManager.stageNodeUpdate(Map({ id: '1234' }));
    expect(updateManager[HISTORY_KEY_NODE_UPDATES].size).toBe(1);
    expect(updateManager).toMatchSnapshot();
  });
  test('stageNodeDelete method', () => {
    updateManager.stageNodeDelete();
    expect(updateManager[HISTORY_KEY_NODE_UPDATES].size).toBe(0);
    updateManager.stageNodeDelete(null);
    expect(updateManager[HISTORY_KEY_NODE_UPDATES].size).toBe(0);
    updateManager.stageNodeDelete(Map({ id: 'null' }));
    expect(updateManager[HISTORY_KEY_NODE_UPDATES].size).toBe(0);
    updateManager.stageNodeDelete(Map({ id: 'undefined' }));
    expect(updateManager[HISTORY_KEY_NODE_UPDATES].size).toBe(0);
    // test that last-write-wins, delete overwrites update
    updateManager.stageNodeUpdate(Map({ id: '1234' }));
    updateManager.stageNodeDelete(Map({ id: '1234' }));
    expect(updateManager).toMatchSnapshot();
  });
  test('addPostIdToUpdates method', () => {
    // mimic a "not-yet-saved" post
    updateManager.init({});
    updateManager.stageNodeUpdate(Map({ id: 'abcd' }));
    expect(
      updateManager[HISTORY_KEY_NODE_UPDATES].get('abcd').get('post_id')
    ).toBeUndefined();
    updateManager.addPostIdToUpdates(1);
    expect(
      updateManager[HISTORY_KEY_NODE_UPDATES].get('abcd').get('post_id')
    ).toBe(1);
  });
  test('clearUpdates method', () => {
    updateManager.stageNodeUpdate(Map({ id: '1111' }));
    updateManager.stageNodeUpdate(Map({ id: 'abcd' }));
    updateManager.stageNodeDelete(Map({ id: '2222' }));
    expect(updateManager[HISTORY_KEY_NODE_UPDATES].size).toBe(3);
    updateManager.clearUpdates();
    expect(updateManager[HISTORY_KEY_NODE_UPDATES].size).toBe(0);
    // can call clearUpdates on empty
    updateManager.clearUpdates();
    expect(updateManager[HISTORY_KEY_NODE_UPDATES].size).toBe(0);
  });
  /**
   * INTEGRATION TESTS - THESE DEPEND ON DocumentModel, or you have to simulate DocumentModel behavior which seems of dubious value
   */
  test('addToUndoHistory - delete a node in the middle', () => {
    const prevSelectionOffsets = { is: 'previousOffsets' };
    const selectionOffsets = { is: 'currentOffsets' };
    const doc = new DocumentModel();
    const firstNode = doc.init(post, updateManager, contentNodes);
    let prevNodesById = doc.nodesById;
    // create history entry when deleting a node
    doc.delete(doc.getNode(imgId));
    // 1 for the deleted node, 1 for the prev node to update next_sibling_id reference
    expect(updateManager[HISTORY_KEY_NODE_UPDATES].size).toBe(2);
    expect(updateManager[HISTORY_KEY_UNDO].size).toBe(0);
    expect(updateManager[HISTORY_KEY_NODE_UPDATES]).toMatchSnapshot();
    updateManager.addToUndoHistory(
      prevNodesById,
      prevSelectionOffsets,
      selectionOffsets
    );
    // there should be 1 history entry in the undo stack
    expect(updateManager[HISTORY_KEY_UNDO].size).toBe(1);
    const firstHistory = updateManager[HISTORY_KEY_UNDO].get(0);
    // there should be 2 nodes in the undo
    expect(firstHistory.get(HISTORY_KEY_UNDO_UPDATES).size).toBe(2);
    expect(firstHistory.get(HISTORY_KEY_UNDO_UPDATES)).toMatchSnapshot();
    expect(firstHistory.get(HISTORY_KEY_UNDO_OFFSETS)).toBe(
      prevSelectionOffsets
    );
    // and 2 in the redo - they should match the current updates
    expect(firstHistory.get(HISTORY_KEY_REDO_UPDATES).size).toBe(2);
    expect(firstHistory.get(HISTORY_KEY_REDO_UPDATES)).toEqual(
      updateManager[HISTORY_KEY_NODE_UPDATES]
    );
    expect(firstHistory.get(HISTORY_KEY_REDO_OFFSETS)).toBe(selectionOffsets);
  });
  test('addToUndoHistory - change a node`s type from P -> H1', () => {
    const prevSelectionOffsets = { is: 'previousOffsets' };
    const selectionOffsets = { is: 'currentOffsets' };
    const doc = new DocumentModel();
    const firstNode = doc.init(post, updateManager, contentNodes);
    let prevNodesById = doc.nodesById;
    // create history entry when changing a node's type
    doc.update(
      doc
        .getNode(formattedPId)
        .set('type', NODE_TYPE_H1)
        .set('meta', Map())
    );
    // 1 for the deleted node, 1 for the prev node to update next_sibling_id reference
    expect(updateManager[HISTORY_KEY_NODE_UPDATES].size).toBe(1);
    expect(updateManager[HISTORY_KEY_UNDO].size).toBe(0);
    expect(updateManager[HISTORY_KEY_NODE_UPDATES]).toMatchSnapshot();
    updateManager.addToUndoHistory(
      prevNodesById,
      prevSelectionOffsets,
      selectionOffsets
    );
    // there should be 1 history entry in the undo stack
    expect(updateManager[HISTORY_KEY_UNDO].size).toBe(1);
    const firstHistory = updateManager[HISTORY_KEY_UNDO].get(0);
    // there should be 2 nodes in the undo
    expect(firstHistory.get(HISTORY_KEY_UNDO_UPDATES).size).toBe(1);
    expect(firstHistory.get(HISTORY_KEY_UNDO_UPDATES)).toMatchSnapshot();
    expect(firstHistory.get(HISTORY_KEY_UNDO_OFFSETS)).toBe(
      prevSelectionOffsets
    );
    // and 2 in the redo - they should match the current updates
    expect(firstHistory.get(HISTORY_KEY_REDO_UPDATES).size).toBe(1);
    expect(firstHistory.get(HISTORY_KEY_REDO_UPDATES)).toEqual(
      updateManager[HISTORY_KEY_NODE_UPDATES]
    );
    expect(firstHistory.get(HISTORY_KEY_REDO_OFFSETS)).toBe(selectionOffsets);
  });
  test('addToUndoHistory - simulate typing inside content field of one node', () => {
    const prevSelectionOffsets = { is: 'previousOffsets' };
    const selectionOffsets = { is: 'currentOffsets' };
    const doc = new DocumentModel();
    const firstNode = doc.init(post, updateManager, contentNodes);
    let prevNodesById = doc.nodesById;
    const newContent = 'Sammys!';
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
      expect(updateManager[HISTORY_KEY_NODE_UPDATES].size).toBe(1);
      expect(updateManager[HISTORY_KEY_UNDO].size).toBe(0);
      updateManager.addToUndoHistory(
        prevNodesById,
        i === 0 ? prevSelectionOffsets : { is: `wrongOffsets${i}` },
        selectionOffsets
      );
      // there shouldn't a history entry until we reach the change threshold
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
    expect(updateManager[HISTORY_KEY_NODE_UPDATES].size).toBe(1);
    expect(updateManager[HISTORY_KEY_NODE_UPDATES]).toMatchSnapshot();
    expect(updateManager[HISTORY_KEY_UNDO].size).toBe(0);
    updateManager.addToUndoHistory(
      prevNodesById,
      { is: `wrongOffsets${newContent.length - 1}` },
      selectionOffsets
    );
    // we should have hit the threshold now
    expect(updateManager[HISTORY_KEY_UNDO].size).toBe(1);
    const firstHistory = updateManager[HISTORY_KEY_UNDO].get(0);
    expect(firstHistory.get(HISTORY_KEY_UNDO_UPDATES).size).toBe(1);
    expect(firstHistory.get(HISTORY_KEY_UNDO_UPDATES)).toMatchSnapshot();
    expect(firstHistory.get(HISTORY_KEY_UNDO_OFFSETS)).toBe(
      prevSelectionOffsets
    );
    expect(firstHistory.get(HISTORY_KEY_REDO_UPDATES).size).toBe(1);
    expect(firstHistory.get(HISTORY_KEY_REDO_UPDATES)).toEqual(
      updateManager[HISTORY_KEY_NODE_UPDATES]
    );
    expect(firstHistory.get(HISTORY_KEY_REDO_OFFSETS)).toBe(selectionOffsets);
  });
  test.todo(
    'addToUndoHistory - simulate select and type inside content field of one node'
  );
  test.todo('addToUndoHistory - simulate select and type across nodes');
  test('applyUpdates', () => {
    const doc = new DocumentModel();
    const firstNode = doc.init(post, updateManager, contentNodes);
    const prevNodesById = doc.nodesById;
    const h2 = doc.getNode(h2Id);
    const img = doc.getNode(imgId);
    doc.update(h2.set('content', 'foo'));
    doc.delete(img);
    const updates = updateManager[HISTORY_KEY_NODE_UPDATES];
    updateManager.clearUpdates();
    expect(updateManager[HISTORY_KEY_NODE_UPDATES].size).toBe(0);
    const updatedNodes = updateManager.applyUpdates(updates, prevNodesById);
    expect(updateManager[HISTORY_KEY_NODE_UPDATES]).toEqual(updates);
    expect(updatedNodes.get(h2Id).get('content')).toBe('foo');
    expect(updatedNodes.get(imgId)).toBeFalsy();
  });
  test.todo('undo');
  test.todo('redo');
  test('getKey', () => {
    expect(updateManager.getKey('foo')).toMatchInlineSnapshot(`"175-foo"`);
  });
  test('getPostIdNamespaceValue & setPostIdNamespaceValue', () => {
    updateManager.setPostIdNamespaceValue('foo', 'bar');
    expect(updateManager.getPostIdNamespaceValue('foo', 'qux')).toBe('bar');
  });
  test('nodeUpdates, redoHistory, undoHistory', () => {
    expect(updateManager[HISTORY_KEY_NODE_UPDATES]).toBe(Map());
    expect(updateManager[HISTORY_KEY_REDO]).toBe(List());
    expect(updateManager[HISTORY_KEY_UNDO]).toBe(List());
  });
  test('saveContentBatch', async () => {
    // empty updates should not make API call
    await updateManager.saveContentBatch();
    expect(api.apiPost).not.toHaveBeenCalled();
    // stage some updates
    updateManager.stageNodeUpdate(Map({ id: '1111' }));
    updateManager.stageNodeUpdate(Map({ id: 'abcd' }));
    updateManager.stageNodeDelete(Map({ id: '2222' }));
    const entries = Object.entries(
      updateManager[HISTORY_KEY_NODE_UPDATES].toJS()
    );
    // test api failure - updates should remain
    expect(updateManager[HISTORY_KEY_NODE_UPDATES].size).toBe(3);
    api.apiPost = jest.fn(async () => ({ error: true }));
    await updateManager.saveContentBatch();
    expect(api.apiPost).toHaveBeenCalledWith('/content', entries);
    // test api success - updates are cleared
    expect(updateManager[HISTORY_KEY_NODE_UPDATES].size).toBe(3);
    api.apiPost = jest.fn(async () => ({}));
    await updateManager.saveContentBatch();
    expect(api.apiPost).toHaveBeenCalledWith('/content', entries);
    expect(updateManager[HISTORY_KEY_NODE_UPDATES].size).toBe(0);
  });
  test('saveContentDebounce', () => {
    updateManager.saveContentBatch = jest.fn();
    updateManager.saveContentBatchDebounce();
    updateManager.saveContentBatchDebounce();
    updateManager.saveContentBatchDebounce();
    jest.runAllTimers();
    expect(updateManager.saveContentBatch).toHaveBeenCalledTimes(1);
  });
});
