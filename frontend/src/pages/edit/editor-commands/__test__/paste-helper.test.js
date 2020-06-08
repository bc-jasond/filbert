import { overrideConsole } from '../../../../common/test-helpers';
import DocumentModel from '../../document-model';
import * as selectionHelpers from '../../selection-helpers';
import { doPaste } from '../paste';
import {
  testPostWithAllTypesJS,
  imgId,
  firstNodeIdH1,
  formattedPContent,
  formattedPId,
} from '../../../../common/test-post-with-all-types';

const { post, contentNodes } = testPostWithAllTypesJS;
overrideConsole();
let doc = DocumentModel();

const mockText = 'some sample string';
const clipboardDataMock = {
  getData: () => mockText,
};

const spyAdjust = jest
  .spyOn(selectionHelpers, 'adjustSelectionOffsetsAndCleanup')
  .mockImplementation((...args) => args[0]);

beforeEach(() => {
  doc = DocumentModel(post.id, {}, contentNodes);
});
describe.skip('Document Model -> paste node helper', () => {
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
  test('handlePasteTextType - plain text - single line paste', () => {
    const clipboardText = 'bib jibbs, bab jabs ';
    const caretStartArg = Math.floor(formattedPContent.length / 2);

    const { startNodeId, caretStart } = handlePasteTextType(
      doc,
      formattedPId,
      caretStartArg,
      clipboardText
    );
    expect(startNodeId).toBe(formattedPId);
    expect(caretStart).toBe(caretStartArg + clipboardText.length);
    expect(spyAdjust).toHaveBeenCalledWith(
      doc.getNode(formattedPId),
      formattedPContent,
      caretStartArg,
      clipboardText.length
    );
  });
  test('handlePasteTextType - plain text - multi line paste', () => {
    const clipboardText = 'bib jibbs\nbab jabs\nbubba rubba jubbson';
    const textLines = clipboardText.split('\n');
    const lastLine = textLines[textLines.length - 1];
    const caretStartArg = Math.floor(firstNodeIdH1.length / 2);
    const originalType = doc.getNode(firstNodeIdH1).get('type');

    const { startNodeId, caretStart } = handlePasteTextType(
      doc,
      firstNodeIdH1,
      caretStartArg,
      clipboardText
    );
    expect(startNodeId).not.toBe(firstNodeIdH1);
    expect(caretStart).toBe(lastLine.length);
    expect(spyAdjust).toHaveBeenCalledTimes(2);
    let current = doc.getNode(firstNodeIdH1);
    for (let i = 0; i < textLines.length; i++) {
      expect(current.get('type')).toBe(originalType);
      current = doc.getNextNode(current.get('id'));
    }
  });
});
