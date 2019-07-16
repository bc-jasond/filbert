import {
  NODE_TYPE_LI,
  NODE_TYPE_OL,
  NODE_TYPE_P,
  NODE_TYPE_SECTION_SPACER,
  ZERO_LENGTH_CHAR
} from '../../common/constants';
import { cleanText } from '../../common/utils';

export function handleBackspaceList(editPipeline, selectedNodeId) {
  const selectedSection = editPipeline.getParent(selectedNodeId);
  if (editPipeline.isFirstChild(selectedNodeId)) {
    let prevSection = editPipeline.getPrevSibling(selectedSection.get('id'));
    // delete a spacer?
    if (prevSection.get('type') === NODE_TYPE_SECTION_SPACER) {
      const spacerSectionId = prevSection.get('id');
      prevSection = editPipeline.getPrevSibling(spacerSectionId);
      editPipeline.delete(spacerSectionId);
    }
    if (prevSection.get('type') === NODE_TYPE_OL) {
      // merge OLs?
      editPipeline.mergeSections(prevSection, selectedSection);
      const lastLi = editPipeline.getLastChild(prevSection.get('id'));
      return [lastLi.get('id'), lastLi.get('content').length];
    }
    // convert 1st LI to P
    const prevParagraph = editPipeline.getPrevSibling(selectedSection.get('id'));
    const wasOnlyChild = editPipeline.isOnlyChild(selectedNodeId);
    editPipeline.mergeParagraphs(prevParagraph.get('id'), selectedNodeId);
    if (wasOnlyChild) {
      // delete empty OL
      editPipeline.delete(selectedSection.get('id'))
    }
    return [prevParagraph.get('id'), prevParagraph.get('content').length];
  }
  const prevSibling = editPipeline.getPrevSibling(selectedNodeId);
  editPipeline.mergeParagraphs(prevSibling.get('id'), selectedNodeId);
  return [prevSibling.get('id'), prevSibling.get('content').length];
}

export function handleEnterList(editPipeline, selectedNodeId, contentLeft, contentRight) {
  if (cleanText(contentLeft).length === 0 && editPipeline.isLastChild(selectedNodeId)) {
    // create a P tag after the OL - only if empty LI is last child (allows empty LIs in the middle of list)
    const olId = editPipeline.getParent(selectedNodeId).get('id');
    editPipeline.delete(selectedNodeId);
    return editPipeline.insertSubSectionAfter(olId, NODE_TYPE_P, contentRight);
  }
  editPipeline.update(editPipeline.getNode(selectedNodeId).set('content', contentLeft));
  return editPipeline.insertSubSectionAfter(selectedNodeId, NODE_TYPE_LI, contentRight);
}

export function insertList(editPipeline, selectedNodeId) {
  const olId = editPipeline.insertSubSectionAfter(selectedNodeId, NODE_TYPE_OL);
  const focusNodeId = editPipeline.insert(olId, NODE_TYPE_LI, 0, ZERO_LENGTH_CHAR);
  editPipeline.delete(selectedNodeId);
  return focusNodeId;
}