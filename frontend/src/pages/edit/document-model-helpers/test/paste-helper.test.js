import { overrideConsole } from '../../../../common/test-helpers';
import DocumentModel from '../../document-model';
import { doPaste } from '../paste';
import * as textTypeHelpers from '../handle-text-type';
import {
  testPostWithAllTypesJS,
  imgId,
  firstNodeIdH1
} from '../../test/test-post-with-all-types';

const { post, contentNodes } = testPostWithAllTypesJS;
overrideConsole();
const doc = new DocumentModel();

const mockText = 'some sample string';
const clipboardDataMock = {
  getData: () => mockText
};

beforeEach(() => {
  doc.init(post, {}, contentNodes);
});
describe('Document Model -> paste node helper', () => {
  test('doPaste - validates input', () => {
    const spy = jest
      .spyOn(textTypeHelpers, 'handlePasteTextType')
      .mockImplementation(() => {});
    // bad node id
    let noopResult = doPaste(doc, {}, clipboardDataMock);
    expect(noopResult).toEqual({});
    // meta type nodes not supported
    noopResult = doPaste(
      doc,
      { caretStart: 0, startNodeId: imgId },
      clipboardDataMock
    );
    expect(noopResult).toEqual({});
    expect(spy).not.toHaveBeenCalled();
  });
  test('doPaste - calls handlePasteTextType with expected parameters', () => {
    const caretStart = 10;
    const spy = jest
      .spyOn(textTypeHelpers, 'handlePasteTextType')
      .mockImplementation(() => {});
    doPaste(doc, { caretStart, startNodeId: firstNodeIdH1 }, clipboardDataMock);
    expect(spy).toHaveBeenCalledWith(doc, firstNodeIdH1, caretStart, mockText);
  });
});
