import { Map } from 'immutable';
import { NODE_TYPE_H1 } from '../../../common/constants';
import { overrideConsole } from '../../../common/test-helpers';
import { nodeIsValid } from '../../../common/utils';

import * as SelectionHelpers from '../selection-helpers';

import DocumentModel from '../document-model';
import {
  firstNodeIdH1,
  h2Id,
  testPostWithAllTypesJS
} from '../../../common/test-post-with-all-types';

overrideConsole();
const updateManagerMock = {
  stageNodeUpdate: jest.fn(),
  stageNodeDelete: jest.fn()
};

const { post, contentNodes } = testPostWithAllTypesJS;

let documentModel;

beforeEach(() => {
  documentModel = new DocumentModel();
  documentModel.init(post, updateManagerMock, contentNodes);
});

describe('DocumentModel', () => {
  test('init', () => {
    expect(documentModel).toMatchSnapshot();
    documentModel.init({}, {});
    expect(documentModel.nodesById.size).toBe(1);
    const placeholderTitle = DocumentModel.getFirstNode(
      documentModel.nodesById
    );
    expect(placeholderTitle.get('type')).toBe(NODE_TYPE_H1);
    expect(nodeIsValid(placeholderTitle)).toBe(true);
  });
  test('getMapWithId', () => {
    const result = documentModel.getMapWithId({});
    expect(nodeIsValid(result)).toBe(true);
    expect(result.get('post_id')).toBe(175);
  });
  test('getNode', () => {
    expect(documentModel.getNode(null)).toBe(Map());
    // finds: root -> content -> ol -> list item
    expect(documentModel.getNode(firstNodeIdH1)).toMatchSnapshot();
    expect(documentModel.getNode('badId')).toBe(Map());
  });
  test('getNextNode', () => {
    // returns Map() when node is at last position
    expect(documentModel.getNextNode('cce3')).toBe(Map());
    expect(documentModel.getNextNode('7a38')).toMatchSnapshot();
  });
  test('getPrevNode', () => {
    // returns Map() when node is at position 0
    expect(documentModel.getPrevNode(firstNodeIdH1)).toBe(Map());
    // nominal case
    expect(documentModel.getPrevNode('4add')).toMatchSnapshot();
  });
  test('isFirstOfType', () => {
    // positive case
    expect(documentModel.isFirstOfType('56da')).toBe(true);
    // negative case - last child
    expect(documentModel.isFirstOfType('9fa0')).toBe(false);
  });
  test('isLastOfType', () => {
    // positive case
    expect(documentModel.isLastOfType('cce3')).toBe(true);
    // negative case - last child
    expect(documentModel.isLastOfType('4b8c')).toBe(false);
  });
  test.todo('getNodesBetween');
  test.todo('getFirstNode');
  test.todo('getLastNode');
  test.todo('insert');
  test('isTextType', () => {
    [
      // P
      'cce3',
      // LI
      '151c',
      // H1
      firstNodeIdH1,
      // h2
      h2Id,
      // Pre
      'fd25'
    ].forEach(nodeId => {
      expect(documentModel.isTextType(nodeId)).toBe(true);
      expect(documentModel.isMetaType(nodeId)).toBe(false);
    });
    [
      // SPACER
      'db70',
      // IMAGE
      '4add',
      // QUOTE
      'c67c'
    ].forEach(nodeId => {
      expect(documentModel.isTextType(nodeId)).toBe(false);
      expect(documentModel.isMetaType(nodeId)).toBe(true);
    });
  });
  test('mergeParagraphs', () => {
    const combinedContent = `${documentModel
      .getNode('621e')
      .get('content')}${documentModel.getNode('f677').get('content')}`;
    const spy = jest
      .spyOn(SelectionHelpers, 'concatSelections')
      .mockImplementation(arg => arg);
    documentModel.mergeParagraphs('621e', 'f677');
    expect(spy).toHaveBeenCalled();
    expect(documentModel.getNode('621e').get('content')).toBe(combinedContent);
  });
  //test.todo('update() - this is tested in update-manager.test.js');
  //test.todo('delete() - this is tested in update-manager.test.js');
});
