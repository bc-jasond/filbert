import { overrideConsole } from '../../../../common/test-helpers';
import DocumentModel from '../../document-model';
import { doSplit } from '../split';
import * as handleMeta from '../handle-meta-type';
import * as handleText from '../handle-text-type';
import {
  testPostWithAllTypesJS,
  imgId,
  firstNodeIdH1,
  firstNodeContent
} from '../../../../common/test-post-with-all-types';

const { post, contentNodes } = testPostWithAllTypesJS;
overrideConsole();
const doc = new DocumentModel();
const spyMeta = jest
  .spyOn(handleMeta, 'handleEnterMetaType')
  .mockImplementation(() => {});
const spyText = jest
  .spyOn(handleText, 'handleEnterTextType')
  .mockImplementation(() => {});

beforeEach(() => {
  jest.resetAllMocks();
  doc.init(post, {}, contentNodes);
});
describe('Document Model -> split node helper', () => {
  test('doSplit - validates input', () => {
    // bad node id
    let noopResult = doSplit(doc, {});
    expect(noopResult).toBeFalsy();
    noopResult = doSplit(doc, { startNodeId: 'null' });
    expect(noopResult).toBeFalsy();
    expect(spyMeta).not.toHaveBeenCalled();
    expect(spyText).not.toHaveBeenCalled();
  });
  test('doSplit - calls handleEnterMetaType() for meta type nodes', () => {
    doSplit(doc, { startNodeId: imgId });
    expect(spyMeta).toHaveBeenCalledWith(doc, imgId);
    expect(spyText).not.toHaveBeenCalled();
  });
  test('doSplit - calls handleEnterTextType() for text type nodes', () => {
    const caretStart = 5;
    doSplit(doc, { startNodeId: firstNodeIdH1, caretStart });
    expect(spyMeta).not.toHaveBeenCalled();
    expect(spyText).toHaveBeenCalledWith(
      doc,
      firstNodeIdH1,
      caretStart,
      firstNodeContent
    );
  });
});
