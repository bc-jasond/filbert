import { Map, List } from 'immutable';

import HistoryManager, { characterDiffSize } from '../history-manager';
import DocumentModel, { getFirstNode } from '../document-model';
import { overrideConsole } from '../../../common/test-helpers';
import {
  formattedPId,
  h2Id,
  imgId,
  testPostWithAllTypesJS,
} from '../../../common/test-post-with-all-types';
import {
  NODE_UPDATE_HISTORY,
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
let doc = DocumentModel();
let updateManager = HistoryManager();

describe('HistoryManager', () => {
  test.todo('history manager tests here');
});
