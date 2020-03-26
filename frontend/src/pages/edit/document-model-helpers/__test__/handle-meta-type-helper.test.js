import { NODE_TYPE_P } from '../../../../common/constants';
import { overrideConsole } from '../../../../common/test-helpers';

import DocumentModel from '../../document-model';
import { handleEnterMetaType } from '../handle-meta-type';

import {
  testPostWithAllTypesJS,
  imgId
} from '../../../../common/test-post-with-all-types';
const { post, contentNodes } = testPostWithAllTypesJS;
overrideConsole();
const doc = new DocumentModel();

beforeEach(() => {
  doc.init(post, { stageNodeUpdate: jest.fn() }, contentNodes);
});
describe('Document Model -> handle MetaType node helper', () => {
  test('handleEnterMetaType - inserts a P when user hits enter on a meta type node', () => {
    const newNodeId = handleEnterMetaType(doc, imgId);
    expect(doc.getNode(newNodeId).get('type')).toBe(NODE_TYPE_P);
  });
});
