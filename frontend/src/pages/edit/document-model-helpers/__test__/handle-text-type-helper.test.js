import {
  NODE_TYPE_LI,
  NODE_TYPE_P,
  NODE_TYPE_PRE,
} from '../../../../common/constants';
import { overrideConsole } from '../../../../common/test-helpers';

import DocumentModel from '../../document-model';
import * as selectionHelpers from '../../selection-helpers';
import {
  handleBackspaceTextType,
  handleEnterTextType,
  handlePasteTextType,
} from '../handle-text-type';

import {
  testPostWithAllTypesJS,
  firstNodeIdH1,
  h2Id,
  spacerId,
  preId,
  formattedLiId,
  pre2Id,
  h2Content,
  firstNodeContent,
  formattedLiContent,
  formattedPContent,
  formattedPId,
} from '../../../../common/test-post-with-all-types';
const { post, contentNodes } = testPostWithAllTypesJS;
overrideConsole();
const doc = new DocumentModel();

const spySplit = jest
  .spyOn(selectionHelpers, 'splitSelectionsAtCaretOffset')
  .mockImplementation((...args) => ({
    leftNode: args[0],
    rightNode: args[1],
  }));
const spyAdjust = jest
  .spyOn(selectionHelpers, 'adjustSelectionOffsetsAndCleanup')
  .mockImplementation((...args) => args[0]);

beforeEach(() => {
  doc.init(
    post,
    { stageNodeUpdate: jest.fn(), stageNodeDelete: jest.fn() },
    contentNodes
  );
});
describe('Document Model -> handle TextType node helper', () => {
  test('handleBackspaceTextType - noop if selectedNodeId is first node in document', () => {
    const { startNodeId } = handleBackspaceTextType(doc, firstNodeIdH1);
    expect(startNodeId).toBe(firstNodeIdH1);
  });
  test('handleBackspaceTextType - deletes an empty Text Type node if previous node is a Meta Type', () => {
    doc.update(doc.getNode(h2Id).set('content', ''));
    const { startNodeId, caretStart } = handleBackspaceTextType(doc, h2Id);
    expect(startNodeId).toBe(spacerId);
    expect(caretStart).toBe(0);
    expect(doc.getNode(h2Id).size).toBe(0);
  });
  test('handleBackspaceTextType - merges content of two Text Type nodes', () => {
    const spy = jest.spyOn(doc, 'mergeParagraphs').mockImplementation(() => {});
    const { startNodeId, caretStart } = handleBackspaceTextType(doc, preId);
    expect(spy).toHaveBeenCalledWith(formattedLiId, preId);
    expect(startNodeId).toBe(formattedLiId);
    expect(caretStart).toEqual(
      doc.getNode(formattedLiId).get('content').length
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
    const clipboardText = 'bib jibbs\nbab jabs\nbubba rubba jubbs';
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
