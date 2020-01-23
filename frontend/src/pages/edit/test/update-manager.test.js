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
    updateManager.stageNodeUpdate('null');
    expect(updateManager.nodeUpdates.size).toBe(0);
    updateManager.stageNodeUpdate('undefined');
    expect(updateManager.nodeUpdates.size).toBe(0);
    // test that last-write-wins, update overwrites delete
    updateManager.stageNodeDelete('foo');
    updateManager.stageNodeUpdate('foo');
    expect(updateManager).toMatchSnapshot();
  });
  test('stageNodeDelete method', () => {
    updateManager.stageNodeDelete();
    expect(updateManager.nodeUpdates.size).toBe(0);
    updateManager.stageNodeDelete(null);
    expect(updateManager.nodeUpdates.size).toBe(0);
    updateManager.stageNodeDelete('null');
    expect(updateManager.nodeUpdates.size).toBe(0);
    updateManager.stageNodeDelete('undefined');
    expect(updateManager.nodeUpdates.size).toBe(0);
    // test that last-write-wins, delete overwrites update
    updateManager.stageNodeUpdate('foo');
    updateManager.stageNodeDelete('foo');
    expect(updateManager).toMatchSnapshot();
  });
  test('addPostIdToUpdates method', () => {
    // mimic a "not-yet-saved" post
    updateManager.init({});
    updateManager.stageNodeUpdate('bar');
    expect(updateManager.nodeUpdates.get('bar').get('post_id')).toBeUndefined();
    updateManager.addPostIdToUpdates(1);
    expect(updateManager.nodeUpdates.get('bar').get('post_id')).toBe(1);
  });
  test('updates method', () => {
    // filter out ids that are "falsy", "null" or not found in the documentModel
    updateManager.stageNodeUpdate('foo');
    updateManager.stageNodeUpdate('qux');
    updateManager.stageNodeDelete('bar');
    updateManager.stageNodeUpdate('badId');
    const documentModelMock = {
      getNode: jest
        .fn()
        .mockImplementation(id => (id === 'badId' ? Map() : Map({ id })))
    };
    const updatesJS = updateManager.updates(documentModelMock);
    expect(updatesJS).toMatchSnapshot();
  });
  test('clearUpdates method', () => {
    updateManager.stageNodeUpdate('foo');
    updateManager.stageNodeUpdate('qux');
    updateManager.stageNodeDelete('bar');
    expect(updateManager.nodeUpdates.size).toBe(3);
    updateManager.clearUpdates();
    expect(updateManager.nodeUpdates.size).toBe(0);
    // can call clearUpdates on empty
    updateManager.clearUpdates();
    expect(updateManager.nodeUpdates.size).toBe(0);
  });
});
