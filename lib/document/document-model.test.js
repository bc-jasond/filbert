import immutable from 'immutable';

import { DocumentModel, DocumentModelNode } from '@filbert/document';
import {
  firstNodeIdH1,
  h2Id,
  imgId,
  lastNodeIdP,
  preId,
  pre2Id,
  formattedLiIdPrev,
  testPostWithAllTypesJS,
  formattedLiId,
  spacerId,
  quoteId,
} from '@filbert/selection';

const { Map } = immutable;
const { post, head, nodes } = testPostWithAllTypesJS;

let documentModel;

beforeEach(() => {
  const nodesWrapped = Map(nodes).map((node) => {
    const w = new DocumentModelNode(node);
    return w;
  });
  documentModel = new DocumentModel(
    post.id,
    new DocumentModelNode(head),
    nodesWrapped
  );
});

describe('DocumentModel', () => {
  test('getNode', () => {
    expect(documentModel.getNode(null)).toBe(undefined);
    expect(documentModel.getNode(firstNodeIdH1)).toEqual(
      new DocumentModelNode(nodes[firstNodeIdH1])
    );
    expect(documentModel.getNode('badId')).toBe(undefined);
  });
  test('getNext', () => {
    // returns Map() when node is at last position
    expect(documentModel.getNext(lastNodeIdP)).toBe(undefined);
    expect(documentModel.getNext('7a38')).toEqual(
      new DocumentModelNode(nodes[pre2Id])
    );
  });
  test('getPrev', () => {
    expect(documentModel.getPrev(firstNodeIdH1)).toBe(undefined);
    // nominal case
    expect(documentModel.getPrev(imgId)).toEqual(
      new DocumentModelNode(nodes[pre2Id])
    );
  });
  test('isFirstOfType', () => {
    // positive case
    expect(documentModel.isFirstOfType('56da')).toBeTruthy();
    // negative case - last child
    expect(documentModel.isFirstOfType(formattedLiIdPrev)).toBeFalsy();
  });
  test('isLastOfType', () => {
    // positive case
    expect(documentModel.isLastOfType(lastNodeIdP)).toBeTruthy();
    // negative case - last child
    expect(documentModel.isLastOfType(preId)).toBeFalsy();
  });
  test('isTextType', () => {
    [
      // P
      lastNodeIdP,
      // LI
      formattedLiId,
      // H1
      firstNodeIdH1,
      // h2
      h2Id,
      // Pre
      preId,
    ].forEach((nodeId) => {
      expect(documentModel.isTextType(nodeId)).toBeTruthy();
      expect(documentModel.isMetaType(nodeId)).toBeFalsy();
    });
    [
      // SPACER
      spacerId,
      // IMAGE
      imgId,
      // QUOTE
      quoteId,
    ].forEach((nodeId) => {
      expect(documentModel.isTextType(nodeId)).toBeFalsy();
      expect(documentModel.isMetaType(nodeId)).toBeTruthy();
    });
  });
  test.todo('insert()');
  test.todo('update()');
  test.todo('delete()');
  test.todo('getNodesBetween()');
});
