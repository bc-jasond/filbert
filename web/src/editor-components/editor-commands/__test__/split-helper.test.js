import {
  NODE_TYPE_H1,
  NODE_TYPE_LI,
  NODE_TYPE_P,
  NODE_TYPE_PRE,
} from '../../../common/constants';
import { overrideConsole } from '../../../common/test-helpers';
import DocumentModel from '../../document-model';
import { getLastExecuteIdFromHistory } from '../../history-manager';
import * as selectionHelpers from '../../selection-helpers';
import { doSplit } from '../split';
import {
  testPostWithAllTypesJS,
  imgId,
  firstNodeIdH1,
  firstNodeContent,
  pre2Id,
  formattedLiId,
  h2Id,
  h2Content,
  formattedLiContent,
} from '../../../common/test-post-with-all-types';

const { post, contentNodes } = testPostWithAllTypesJS;
overrideConsole();
let doc = DocumentModel();

const spySplit = jest
  .spyOn(selectionHelpers, 'splitSelectionsAtCaretOffset')
  .mockImplementation((...args) => ({
    leftNode: args[0],
    rightNode: args[1],
  }));

beforeEach(() => {
  jest.clearAllMocks();
  doc = DocumentModel(post.id, contentNodes);
});
describe('Document Model -> split node helper doSplit()', () => {
  test('validates input', () => {
    expect(() => {
      // missing node id
      doSplit(doc, {});
    }).toThrow();
    expect(() => {
      // bad node id
      doSplit(doc, { startNodeId: 'null' });
    });
    expect(spySplit).not.toHaveBeenCalled();
  });
  test('adds a P tag after meta type nodes', () => {
    const {
      // historyState,
      executeSelectionOffsets: { startNodeId, caretStart },
    } = doSplit(doc, { startNodeId: imgId });
    expect(doc.getNode(startNodeId).get('type')).toBe(NODE_TYPE_P);
    expect(caretStart).toBe(0);
    expect(spySplit).not.toHaveBeenCalled();
  });
  test('splits H1 type nodes at a caret position', () => {
    const caretStartArg = 6;
    const {
      // historyState,
      executeSelectionOffsets: { startNodeId, caretStart },
    } = doSplit(doc, { startNodeId: firstNodeIdH1, caretStart: caretStartArg });
    const rightNode = doc.getNode(startNodeId);
    expect(rightNode.get('type')).toBe(NODE_TYPE_H1);
    expect(rightNode.get('content')).toBe(
      firstNodeContent.substring(caretStartArg)
    );
    expect(caretStart).toBe(0);
    expect(spySplit).not.toHaveBeenCalled();
  });
  test('user hits enter on empty PRE or LI to terminate a PRE ("code") or LI section', () => {
    let history = doc.insert(NODE_TYPE_PRE, pre2Id);
    const newLastPreId = getLastExecuteIdFromHistory(history);
    let {
      // historyState,
      executeSelectionOffsets: { startNodeId, caretStart },
    } = doSplit(doc, { startNodeId: newLastPreId, caretStart: 0 });
    expect(startNodeId).toEqual(newLastPreId);
    expect(doc.getNode(newLastPreId).get('type')).toBe(NODE_TYPE_P);
    history = doc.insert(NODE_TYPE_LI, formattedLiId);
    const newLastLiId = getLastExecuteIdFromHistory(history);
    ({
      // historyState,
      executeSelectionOffsets: { startNodeId, caretStart },
    } = doSplit(doc, { startNodeId: newLastLiId, caretStart: 0 }));
    expect(startNodeId).toEqual(newLastLiId);
    expect(doc.getNode(newLastLiId).get('type')).toBe(NODE_TYPE_P);
  });
  test('H1 or H2 - remains heading when user hits enter at beginning', () => {
    const originalType = doc.getNode(firstNodeIdH1).get('type');
    const {
      // historyState,
      executeSelectionOffsets: { startNodeId, caretStart },
    } = doSplit(doc, { startNodeId: firstNodeIdH1, caretStart: 0 });
    expect(startNodeId).not.toEqual(firstNodeIdH1);
    expect(doc.getNextNode(firstNodeIdH1).get('type')).toBe(originalType);
    expect(doc.getNode(startNodeId).get('type')).toBe(NODE_TYPE_H1);
    expect(doc.getNode(startNodeId).get('content')).toEqual(firstNodeContent);
  });
  test('H1 or H2 - inserts empty P when user hits enter at end', () => {
    const {
      // historyState,
      executeSelectionOffsets: { startNodeId, caretStart },
    } = doSplit(doc, { startNodeId: h2Id, caretStart: h2Content.length });
    expect(startNodeId).not.toBe(h2Id);
    expect(doc.getNode(h2Id).get('content')).toEqual(h2Content);
    expect(doc.getNextNode(h2Id).get('id')).toEqual(startNodeId);
    expect(doc.getNode(startNodeId).get('type')).toBe(NODE_TYPE_P);
    expect(doc.getNode(startNodeId).get('content')).toEqual('');
  });
  test('LI with Selections - splits correctly in middle', () => {
    const caretStartArg = Math.floor(formattedLiContent / 2);

    const {
      // historyState,
      executeSelectionOffsets: { startNodeId, caretStart },
    } = doSplit(doc, { startNodeId: formattedLiId, caretStart: caretStartArg });
    expect(spySplit).toHaveBeenCalled();
    expect(doc.getNode(startNodeId).get('content')).toEqual(
      formattedLiContent.substring(caretStartArg)
    );
    expect(doc.getNode(startNodeId).get('type')).toBe(NODE_TYPE_LI);
  });
});
