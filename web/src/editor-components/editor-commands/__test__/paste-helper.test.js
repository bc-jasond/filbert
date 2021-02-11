import { overrideConsole } from '../../../common/test-helpers';
import DocumentModel from '@filbert/document/document-model';
import * as selectionHelpers from '@filbert/selection';
import { doPaste } from '../paste';
import {
  testPostWithAllTypesJS,
  imgId,
  firstNodeIdH1,
  firstNodeContent,
  firstPId,
} from '@filbert/util/test-post-with-all-types';

const { post, contentNodes } = testPostWithAllTypesJS;
overrideConsole();
let doc;

const mockText = 'some sample string';
const clipboardDataMock = {
  getData: () => mockText,
};

const spyAdjust = jest
  .spyOn(selectionHelpers, 'adjustSelectionOffsetsAndCleanup')
  .mockImplementation((...args) => args[0]);

beforeEach(() => {
  jest.clearAllMocks();
  doc = DocumentModel(post.id, contentNodes);
});
describe('Document Model -> paste node helper doPaste()', () => {
  test('validates input', () => {
    expect(() => {
      // bad node id
      doPaste(doc, {}, clipboardDataMock);
    }).toThrow();
    expect(() => {
      // meta type nodes not supported
      doPaste(doc, { caretStart: 0, startNodeId: imgId }, clipboardDataMock);
    });
    expect(spyAdjust).not.toHaveBeenCalled();
  });
  test('pastes a single line of text', () => {
    const caretStartArg = 10;
    const {
      historyState,
      executeSelectionOffsets: { startNodeId, caretStart },
    } = doPaste(
      doc,
      { caretStart: caretStartArg, startNodeId: firstNodeIdH1 },
      clipboardDataMock
    );
    expect(startNodeId).toEqual(firstNodeIdH1);
    expect(caretStart).toEqual(caretStartArg + mockText.length);
    expect(historyState).toMatchSnapshot();
    expect(spyAdjust).toHaveBeenCalledWith(
      doc.getNode(firstNodeIdH1),
      firstNodeContent,
      caretStartArg,
      mockText.length
    );
  });
  test('pastes plain text - multi line paste', () => {
    const clipboardText = 'bib jibbs\nbab jabs\nbubba rubba jubbson';
    const textLines = clipboardText.split('\n');
    const lastLine = textLines[textLines.length - 1];
    const clipboardDataMockMultiLine = {
      getData: () => clipboardText,
    };
    const caretStartArg = Math.floor(firstNodeIdH1.length / 2);
    const originalType = doc.getNode(firstNodeIdH1).get('type');

    const {
      historyState,
      executeSelectionOffsets: { startNodeId, caretStart },
    } = doPaste(
      doc,
      { startNodeId: firstNodeIdH1, caretStart: caretStartArg },
      clipboardDataMockMultiLine
    );
    expect(startNodeId).not.toBe(firstNodeIdH1);
    expect(caretStart).toBe(lastLine.length);
    expect(historyState.length).toBe(6);
    expect(historyState.pop().executeState.get('next_sibling_id')).toBe(
      firstPId
    );
    expect(spyAdjust).toHaveBeenCalledTimes(2);
    let current = doc.getNode(firstNodeIdH1);
    for (let i = 0; i < textLines.length; i++) {
      expect(current.get('type')).toBe(originalType);
      current = doc.getNextNode(current.get('id'));
    }
  });
});
