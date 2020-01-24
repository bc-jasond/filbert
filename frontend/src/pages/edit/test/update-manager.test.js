import { Map } from 'immutable';
import UpdateManager from '../update-manager';
import {
  overrideConsole,
  mockLocalStorage,
  mockSetTimeout
} from '../../../common/test-helpers';
import { clearForTests } from '../../../common/local-storage';

const testPostJS = {
  id: 1,
  user_id: 1,
  canonical: 'hello-world',
  title: 'Hello World!',
  abstract:
    'Creating a simple React ( + Babel + Webpack + yarn) starter project is actually proving to be difficult starting from the documentation.',
  created: '2019-05-18 17:28:55',
  updated: '2019-05-25 00:36:52',
  published: '2019-01-04 00:00:00',
  deleted: null
};

overrideConsole();
mockLocalStorage();
mockSetTimeout();
let updateManager;

beforeEach(() => {
  clearForTests();
  localStorage.clear();
  updateManager = new UpdateManager();
  updateManager.init(testPostJS);
});

describe('UpdateManager', () => {
  test('init method', () => {
    expect(updateManager).toMatchSnapshot();
  });
  test('stageNodeUpdate method', () => {
    updateManager.stageNodeUpdate();
    expect(updateManager.nodeUpdates.size).toBe(0);
    updateManager.stageNodeUpdate(null);
    expect(updateManager.nodeUpdates.size).toBe(0);
    updateManager.stageNodeUpdate(Map({id:'null'}));
    expect(updateManager.nodeUpdates.size).toBe(0);
    updateManager.stageNodeUpdate(Map({id:'undefined'}));
    expect(updateManager.nodeUpdates.size).toBe(0);
    // test that last-write-wins, update overwrites delete
    updateManager.stageNodeDelete(Map({id:'1234'}));
    updateManager.stageNodeUpdate(Map({id:'1234'}));
    expect(updateManager.nodeUpdates.size).toBe(1);
    expect(updateManager).toMatchSnapshot();
  });
  test('stageNodeDelete method', () => {
    updateManager.stageNodeDelete();
    expect(updateManager.nodeUpdates.size).toBe(0);
    updateManager.stageNodeDelete(null);
    expect(updateManager.nodeUpdates.size).toBe(0);
    updateManager.stageNodeDelete(Map({id:'null'}));
    expect(updateManager.nodeUpdates.size).toBe(0);
    updateManager.stageNodeDelete(Map({id:'undefined'}));
    expect(updateManager.nodeUpdates.size).toBe(0);
    // test that last-write-wins, delete overwrites update
    updateManager.stageNodeUpdate(Map({id:'1234'}));
    updateManager.stageNodeDelete(Map({id:'1234'}));
    expect(updateManager).toMatchSnapshot();
  });
  test('addPostIdToUpdates method', () => {
    // mimic a "not-yet-saved" post
    updateManager.init({});
    updateManager.stageNodeUpdate(Map({id:'abcd'}));
    expect(updateManager.nodeUpdates.get('abcd').get('post_id')).toBeUndefined();
    updateManager.addPostIdToUpdates(1);
    expect(updateManager.nodeUpdates.get('abcd').get('post_id')).toBe(1);
  });
  test('clearUpdates method', () => {
    updateManager.stageNodeUpdate(Map({id:'1111'}));
    updateManager.stageNodeUpdate(Map({id:'abcd'}));
    updateManager.stageNodeDelete(Map({id:'2222'}));
    expect(updateManager.nodeUpdates.size).toBe(3);
    updateManager.clearUpdates();
    expect(updateManager.nodeUpdates.size).toBe(0);
    // can call clearUpdates on empty
    updateManager.clearUpdates();
    expect(updateManager.nodeUpdates.size).toBe(0);
  });
  test.todo('addToUndoHistory');
  test.todo('applyUpdates');
  test.todo('undo');
  test.todo('redo');
  test.todo('getters / setters');
  test.todo('saveContentBatch');
  test.todo('saveContentDebounce');
});
