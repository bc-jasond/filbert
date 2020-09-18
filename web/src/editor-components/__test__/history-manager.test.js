import { fromJS, Map } from 'immutable';
import { reviver } from '../../common/utils';

import HistoryManager, { characterDiffSize } from '../history-manager';
import {
  makeHistoryLogEntries,
  overrideConsole,
} from '../../common/test-helpers';
import {
  formattedPId,
  h2Id,
  imgId,
  testPostWithAllTypesJS,
} from '../../common/test-post-with-all-types';
import {
  nodeUpdatesByNodeId,
  contentNodeHistoryLog,
} from '../../common/test-history-log-fixture';
import {
  NODE_UPDATE_HISTORY,
  HISTORY_KEY_UNEXECUTE_OFFSETS,
  HISTORY_KEY_UNEXECUTE_STATES,
  HISTORY_KEY_EXECUTE_OFFSETS,
  HISTORY_KEY_EXECUTE_STATES,
  NODE_TYPE_H1,
} from '../../common/constants';

const { post, contentNodes } = testPostWithAllTypesJS;
const prevSelectionOffsets = { is: 'previousOffsets' };
const selectionOffsets = { is: 'currentOffsets' };

overrideConsole();
let historyManager;

const apiClientMock = {post: jest.fn(async () => ({}))};

beforeEach(() => {
  historyManager = HistoryManager(post.id, apiClientMock);
});

describe('getLocalHistoryLog', () => {
  test('gets an empty history log by default', () => {
    expect(historyManager.getLocalHistoryLog()).toEqual([]);
  });
});
describe('saveAndClearLocalHistoryLog', () => {
  test('filters entries - execute & unexecute are falsy', async (done) => {
    const [logEntry] = makeHistoryLogEntries([[[[null, null]]]]);
    historyManager.appendToHistoryLog(logEntry);
    // make sure we succeeded in adding an "empty" log entry
    expect(historyManager.getLocalHistoryLog().length).toBe(1);
    expect(await historyManager.saveAndClearLocalHistoryLog()).toEqual({});
    done();
  });
  test('filters entries - execute & unexecute are "equals()"', async (done) => {
    const [logEntry] = makeHistoryLogEntries([
      [[[Map({ foo: 'bar' }), Map({ foo: 'bar' })]]],
    ]);
    historyManager.appendToHistoryLog(logEntry);
    // make sure we succeeded in adding a log entry
    expect(historyManager.getLocalHistoryLog().length).toBe(1);
    expect(apiClientMock.post).not.toHaveBeenCalled();
    expect(await historyManager.saveAndClearLocalHistoryLog()).toEqual({});
    done();
  });
  test('adds multiple history log entries, correctly maps them into snapshot updates', async (done) => {
    contentNodeHistoryLog.forEach((logEntry) => {
      historyManager.appendToHistoryLog(logEntry);
    });
    // make sure we succeeded in adding log entries
    expect(historyManager.getLocalHistoryLog().length).toBe(
      contentNodeHistoryLog.length
    );
    await historyManager.saveAndClearLocalHistoryLog();
    expect(apiClientMock.post).toHaveBeenCalledWith(`/content/${post.id}`, {
      nodeUpdatesByNodeId,
      contentNodeHistoryLog: contentNodeHistoryLog.map((logEntry) =>
        fromJS(logEntry, reviver)
      ),
    });
    done();
  });
  test('handles API errors, doesnt clear log', async (done) => {
    apiClientMock.post.mockReturnValue(Promise.resolve({ error: 'foo' }));
    contentNodeHistoryLog.forEach((logEntry) => {
      historyManager.appendToHistoryLog(logEntry);
    });
    // make sure we succeeded in adding log entries
    expect(historyManager.getLocalHistoryLog().length).toBe(
      contentNodeHistoryLog.length
    );
    const { error } = await historyManager.saveAndClearLocalHistoryLog();
    expect(error).toEqual('foo');
    // make sure we didn't clear history log entries
    expect(historyManager.getLocalHistoryLog().length).toBe(
      contentNodeHistoryLog.length
    );
    done();
  });
  test('has at most one request in flight at a time', async (done) => {
    apiClientMock.post.mockReturnValue(
      new Promise((resolve) => {
        setTimeout(() => resolve({}), 0);
      })
    );
    contentNodeHistoryLog.forEach((logEntry) => {
      historyManager.appendToHistoryLog(logEntry);
    });
    // make sure we succeeded in adding log entries
    expect(historyManager.getLocalHistoryLog().length).toBe(
      contentNodeHistoryLog.length
    );
    historyManager.saveAndClearLocalHistoryLog();
    // this 2nd try should get throttled
    const { throttled } = await historyManager.saveAndClearLocalHistoryLog();
    expect(throttled).toBe(true);
    done();
  });
});
describe('appendToHistoryLog', () => {
  test("doesn't add a history entry with an empty historyState", () => {
    historyManager.appendToHistoryLog({});
    expect(historyManager.getLocalHistoryLog().length).toBe(0);
  });
});
describe('appendToHistoryLogWhenNCharsAreDifferent', () => {
  test('throws if historyState has more than one entry (that would imply more than one node changed)', () => {
    expect(() => {
      historyManager.appendToHistoryLogWhenNCharsAreDifferent({
        historyState: ['one', 'two'],
      });
    }).toThrow();
  });
  test('only adds a history entry every N chars for a given comparison path', () => {
    let logEntry;
    let last = '';
    let sampleText = 'barbaz';
    // adding up to N chars should not result in a history log entry
    for (let i = 0; i < sampleText.length; i++) {
      let current = sampleText.charAt(i);
      [logEntry] = makeHistoryLogEntries([
        [
          [
            [
              Map({ id: 'qux', foo: `${last}${current}` }),
              Map({ id: 'qux', foo: last }),
            ],
          ],
        ],
      ]);
      historyManager.appendToHistoryLogWhenNCharsAreDifferent({
        ...logEntry,
        comparisonPath: ['foo'],
      });
      expect(historyManager.getLocalHistoryLog().length).toBe(0);
      last += current;
    }
    // adding one more char should now flush the pending node into the log
    [logEntry] = makeHistoryLogEntries([
      [[[Map({ id: 'qux', foo: `${last}X` }), Map({ id: 'qux', foo: last })]]],
    ]);
    const [logEntryExpected] = makeHistoryLogEntries([
      [[[Map({ id: 'qux', foo: `${last}X` }), Map({ id: 'qux', foo: '' })]]],
    ]);
    historyManager.appendToHistoryLogWhenNCharsAreDifferent({
      ...logEntry,
      comparisonPath: ['foo'],
    });
    expect(historyManager.getLocalHistoryLog()).toEqual([
      fromJS(logEntryExpected),
    ]);
  });
  test('flushes pending node when nodeId changes, even if N different chars isnt satisfied', () => {
    const [logEntry] = makeHistoryLogEntries([
      [[[Map({ id: 'qux', foo: '1234' }), Map({ id: 'qux', foo: '' })]]],
    ]);
    historyManager.appendToHistoryLogWhenNCharsAreDifferent({
      ...logEntry,
      comparisonPath: ['foo'],
    });
    expect(historyManager.getLocalHistoryLog().length).toBe(0);
    const [logEntry2] = makeHistoryLogEntries([
      [[[Map({ id: 'bar', foo: 'a' }), Map({ id: 'bar', foo: '' })]]],
    ]);
    historyManager.appendToHistoryLogWhenNCharsAreDifferent({
      ...logEntry2,
      comparisonPath: ['foo'],
    });
    expect(historyManager.getLocalHistoryLog()).toEqual([fromJS(logEntry)]);
  });
});
describe('undo & redo', () => {
  test('handles API errors, returns Map()', async (done) => {
    apiClientMock.post.mockReturnValue(Promise.resolve({ error: 'foo' }));
    // UNDO
    const undoResult = await historyManager.undo();
    expect(undoResult.get('error')).toBe('foo');
    // REDO
    const redoResult = await historyManager.redo();
    expect(redoResult.get('error')).toBe('foo');
    done();
  });
  test('has at most one request in flight at a time', async (done) => {
    // UNDO
    apiClientMock.post.mockReturnValue(
      new Promise((resolve) => {
        setTimeout(() => resolve({}), 0);
      })
    );
    historyManager.undo().then((result) => {
      expect(result.get('throttled')).toBeFalsy();
    });
    // this 2nd try should get throttled
    const undoResult = await historyManager.undo();
    expect(undoResult.get('throttled')).toBeTruthy();

    // REDO
    historyManager = HistoryManager(post.id, apiClientMock);
    historyManager.redo().then((result) => {
      expect(result.get('throttled')).toBeFalsy();
    });
    // this 2nd try should get throttled
    const redoResult = await historyManager.redo();
    expect(redoResult.get('throttled')).toBeTruthy();
    done();
  });
  test("doesn't apply empty updates", async (done) => {
    apiClientMock.post.mockReturnValue(Promise.resolve({ data: { foo: 'bar' } }));
    // UNDO
    const undoResult = await historyManager.undo();
    expect(undoResult).toEqual(Map());
    // REDO
    const redoResult = await historyManager.undo();
    expect(redoResult).toEqual(Map());
    done();
  });
  test('updates and deletes nodes in the current snapshot from API results', async (done) => {
    const currentNodesById = fromJS({
      id1: { id: 'id1', foo: '1' },
      //id2: { id: 'id2', foo: '2' },
      id3: { id: 'id3', foo: '3' },
    });
    const undoNodesById = [
      { id: 'id1', foo: 'buz' },
      { id: 'id2', foo: 'bar' },
      { id: 'id3', foo: 'qux' },
      // this should override id2 above
      { id: 'id2', foo: 'baz' },
      // this should override id1 above
      'id1',
    ];
    const expectedUndoNodesById = fromJS({
      id3: { id: 'id3', foo: 'qux' },
      id2: { id: 'id2', foo: 'baz' },
    });
    // note: these are reversed from the above undo nodes
    const redoNodesById = [
      'id1',
      { id: 'id2', foo: 'baz' },
      { id: 'id3', foo: 'qux' },
      // this should override id2 above
      { id: 'id2', foo: 'bar' },
      // this should override id1 above
      { id: 'id1', foo: 'buz' },
    ];
    const expectedRedoNodesById = fromJS({
      id3: { id: 'id3', foo: 'qux' },
      id2: { id: 'id2', foo: 'bar' },
      id1: { id: 'id1', foo: 'buz' },
    });

    // UNDO
    apiClientMock.post.mockReturnValue(
      Promise.resolve({
        data: {
          updatedPost: 'foo',
          selectionOffsets: 'bar',
          // order matters here!  consumer must remember to reverse history order for undo
          nodeUpdatesById: undoNodesById,
        },
      })
    );
    const undoResult = await historyManager.undo(currentNodesById);
    expect(undoResult.get('nodesById')).toEqual(expectedUndoNodesById);
    expect(undoResult.get('selectionOffsets')).toBe('bar');
    expect(undoResult.get('updatedPost')).toBe('foo');

    // REDO
    apiClientMock.post.mockReturnValue(
      Promise.resolve({
        data: {
          updatedPost: 'qux',
          selectionOffsets: 'foo',
          // order matters here!  consumer must remember to reverse history order for undo
          nodeUpdatesById: redoNodesById,
        },
      })
    );
    const redoResult = await historyManager.redo(currentNodesById);
    expect(redoResult.get('nodesById')).toEqual(expectedRedoNodesById);
    expect(redoResult.get('selectionOffsets')).toBe('foo');
    expect(redoResult.get('updatedPost')).toBe('qux');
    done();
  });
});
