import {
  NODE_TYPE_LI,
  NODE_TYPE_P,
  NODE_TYPE_PRE,
} from '../../../../common/constants';
import { overrideConsole } from '../../../../common/test-helpers';
import DocumentModel from '../../document-model';
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
} from '../../../../common/test-post-with-all-types';

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
  doc = DocumentModel(post.id, {}, contentNodes);
});
describe.skip('Document Model -> split node helper', () => {
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
  test('handleEnterTextType - user hits enter on empty PRE or LI to terminate a PRE ("code") or LI section', () => {
    const newLastPreId = doc.insert(NODE_TYPE_PRE, pre2Id);
    const nodeId = handleEnterTextType(
      doc,
      newLastPreId,
      0,
      doc.getNode(newLastPreId).get('content')
    );
    expect(nodeId).toEqual(newLastPreId);
    expect(doc.getNode(newLastPreId).get('type')).toBe(NODE_TYPE_P);
    const newLastLiId = doc.insert(NODE_TYPE_LI, formattedLiId);
    const nodeId2 = handleEnterTextType(
      doc,
      newLastLiId,
      0,
      doc.getNode(newLastLiId).get('content')
    );
    expect(nodeId2).toEqual(newLastLiId);
    expect(doc.getNode(newLastLiId).get('type')).toBe(NODE_TYPE_P);
    expect(nodeId).not.toEqual(nodeId2);
  });
  test('handleEnterTextType - H1 or H2 - converts to empty P, inserts heading after - when user hits enter at beginning', () => {
    const originalType = doc.getNode(firstNodeIdH1).get('type');
    const leftNodeId = handleEnterTextType(
      doc,
      firstNodeIdH1,
      0,
      firstNodeContent
    );
    expect(leftNodeId).toEqual(firstNodeIdH1);
    expect(doc.getNode(leftNodeId).get('type')).toBe(NODE_TYPE_P);
    expect(doc.getNextNode(leftNodeId).get('type')).toBe(originalType);
    expect(doc.getNextNode(leftNodeId).get('content')).toEqual(
      firstNodeContent
    );
  });
  test('handleEnterTextType - H1 or H2 - inserts empty P when user hits enter at end', () => {
    const newNodeId = handleEnterTextType(
      doc,
      h2Id,
      h2Content.length,
      h2Content
    );
    expect(newNodeId).not.toBe(h2Id);
    expect(doc.getNode(h2Id).get('content')).toEqual(h2Content);
    expect(doc.getNextNode(h2Id).get('id')).toEqual(newNodeId);
    expect(doc.getNode(newNodeId).get('type')).toBe(NODE_TYPE_P);
    expect(doc.getNode(newNodeId).get('content')).toEqual('');
  });
  test('handleEnterTextType - LI with Selections - splits correctly in middle', () => {
    const caretStart = Math.floor(formattedLiContent / 2);

    const newNodeId = handleEnterTextType(
      doc,
      formattedLiId,
      caretStart,
      formattedLiContent
    );
    expect(spySplit).toHaveBeenCalled();
    expect(doc.getNode(newNodeId).get('content')).toEqual(
      formattedLiContent.substring(caretStart)
    );
    expect(doc.getNode(newNodeId).get('meta')).not.toEqual(
      doc.getNode(formattedLiId).get('meta')
    );
  });
});
