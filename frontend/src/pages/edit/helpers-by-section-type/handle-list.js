import { Map } from 'immutable';
import {
  NODE_TYPE_LI,
  NODE_TYPE_OL,
  NODE_TYPE_P,
  NODE_TYPE_SECTION_SPACER,
} from '../../../common/constants';
import { cleanText } from '../../../common/utils';
import { splitSelectionsAtCaretOffset } from '../selection-helpers';

export function handleBackspaceList(documentModel, selectedNodeId) {
  const selectedOl = documentModel.getParent(selectedNodeId);
  let prevSection = documentModel.getPrevSibling(selectedOl.get('id'));
  if (documentModel.isFirstChild(selectedNodeId)) {
    if (documentModel.isFirstChild(selectedOl.get('id'))) {
      const selectedSection = documentModel.getSection(selectedOl.get('id'));
      prevSection = documentModel.getPrevSibling(selectedSection.get('id'));
      // delete a spacer?
      if (prevSection.get('type') === NODE_TYPE_SECTION_SPACER) {
        const spacerSectionId = prevSection.get('id');
        prevSection = documentModel.getPrevSibling(spacerSectionId);
        documentModel.delete(spacerSectionId);
      }
      // overloading prevSection to mean 'prevParagraph' I know, I know...
      if (!documentModel.canFocusNode(prevSection.get('id'))) {
        prevSection = documentModel.getLastChild(prevSection.get('id'))
      }
    }
    if (prevSection.get('type') === NODE_TYPE_OL) {
      // merge OLs?
      documentModel.mergeSections(prevSection, selectedOl);
      const lastLi = documentModel.getLastChild(prevSection.get('id'));
      return [lastLi.get('id'), lastLi.get('content').length];
    }
    // convert 1st LI to P, H1, H2
    const wasOnlyChild = documentModel.isOnlyChild(selectedNodeId);
    documentModel.mergeParagraphs(prevSection.get('id'), selectedNodeId);
    if (wasOnlyChild) {
      const section = documentModel.getSection(selectedOl.get('id'));
      // delete empty OL
      documentModel.delete(selectedOl.get('id'));
      if (documentModel.isOnlyChild(selectedOl.get('id'))) {
        // delete empty section
        documentModel.delete(section.get('id'))
      }
    }
    return [prevSection.get('id'), prevSection.get('content').length];
  }
  // merge LIs within the same list
  const prevSibling = documentModel.getPrevSibling(selectedNodeId);
  documentModel.mergeParagraphs(prevSibling.get('id'), selectedNodeId);
  return [prevSibling.get('id'), prevSibling.get('content').length];
}

export function handleEnterList(documentModel, selectedNodeId, caretPosition, content) {
  const contentLeft = content.substring(0, caretPosition);
  const contentRight = content.substring(caretPosition);
  console.info('ENTER "list" content left: ', contentLeft, 'content right: ', contentRight);
  if (cleanText(contentLeft).length === 0 && documentModel.isLastChild(selectedNodeId)) {
    // user hits enter with caret at position 0 on last list item - move all text (if any) into a P tag below the list
    // create a P tag after the OL - (allows empty LIs in the middle of list)
    const olId = documentModel.getParent(selectedNodeId).get('id');
    const wasOnlyChild = documentModel.isOnlyChild(selectedNodeId);
    const selectedNode = documentModel.getNode(selectedNodeId);
    documentModel.delete(selectedNodeId);
    const pId = documentModel.insertSubSectionAfter(olId, NODE_TYPE_P, contentRight, selectedNode.get('meta', Map()));
    if (wasOnlyChild) {
      documentModel.delete(olId);
    }
    return pId;
  }
  const rightNodeId = documentModel.insertSubSectionAfter(selectedNodeId, NODE_TYPE_LI, contentRight);
  let leftNode = documentModel.getNode(selectedNodeId).set('content', contentLeft);
  let rightNode = documentModel.getNode(rightNodeId);
  [leftNode, rightNode] = splitSelectionsAtCaretOffset(leftNode, rightNode, caretPosition);
  documentModel.update(leftNode);
  documentModel.update(rightNode);
  return rightNodeId;
}

export function insertList(documentModel, selectedNodeId) {
  const olId = documentModel.insertSubSectionAfter(selectedNodeId, NODE_TYPE_OL);
  const focusNodeId = documentModel.insert(olId, NODE_TYPE_LI, 0);
  documentModel.delete(selectedNodeId);
  return focusNodeId;
}


/**
 * split a list into two at a list item (selectedNodeId) - not including the list item
 */
function splitList(documentModel, selectedNodeId) {
  const listId = documentModel.getParent(selectedNodeId).get('id');
  const listItems = documentModel.getChildren(listId);
  const nodeIdx = listItems.findIndex(s => s.get('id') === selectedNodeId);
  
  // update existing list
  const leftListItems = listItems.slice(0, nodeIdx);
  if (leftListItems.size === 0) {
    documentModel.delete(listId);
  } else {
    documentModel.setChildren(listId, leftListItems);
    documentModel.updateNodesForParent(listId);
  }
  
  // new list
  // NOTE: skipping selectedNode with + 1 here intentionally
  const rightListItems = listItems.slice(nodeIdx + 1);
  let newListId;
  if (rightListItems.size > 0) {
    newListId = documentModel.insertSubSectionAfter(listId, NODE_TYPE_OL);
    documentModel.setChildren(newListId, rightListItems);
    documentModel.updateNodesForParent(newListId);
  }
  
  // return an offset to split after before
  return leftListItems.size > 0 ? 1 : 0;
}

/**
 * For the Format Selection menu on a list item -> H1 or H2
 */
export function splitListReplaceListItemWithSection(documentModel, selectedNodeId, sectionType) {
  const content = documentModel.getNode(selectedNodeId).get('content');
  const listId = documentModel.getParent(selectedNodeId).get('id');
  const section = documentModel.getSection(selectedNodeId);
  const sectionId = section.get('id');
  const listItemWasOnlyChild = documentModel.isOnlyChild(selectedNodeId);
  const listWasOnlyChild = documentModel.isOnlyChild(listId);
  const listIdx = documentModel
    .getChildren(sectionId)
    .findIndex(s => s.get('id') === listId);
  const sectionIdx = documentModel
    .getChildren(documentModel.rootId)
    .findIndex(s => s.get('id') === sectionId);
  
  // non-split scenario - just update existing section
  if (listItemWasOnlyChild && listWasOnlyChild) {
    documentModel.delete(selectedNodeId);
    documentModel.delete(listId);
    return documentModel.update(section
      .set('type', sectionType)
      .set('content', content)
    );
  }
  
  const listOffset = splitList(documentModel, selectedNodeId);
  const sectionOffset = documentModel.splitSectionForFormatChange(sectionId, listIdx + listOffset);
  
  return documentModel.insertSection(sectionType, sectionIdx + sectionOffset, content);
}