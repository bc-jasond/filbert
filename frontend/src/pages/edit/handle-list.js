import {
  NODE_TYPE_LI,
  NODE_TYPE_OL,
  NODE_TYPE_P,
  NODE_TYPE_SECTION_SPACER,
} from '../../common/constants';
import { cleanText } from '../../common/utils';

export function handleBackspaceList(editPipeline, selectedNodeId) {
  const selectedOl = editPipeline.getParent(selectedNodeId);
  let prevSection;
  if (editPipeline.isFirstChild(selectedNodeId)) {
    if (editPipeline.isFirstChild(selectedOl.get('id'))) {
      const selectedSection = editPipeline.getSection(selectedOl.get('id'));
      prevSection = editPipeline.getPrevSibling(selectedSection.get('id'));
      // delete a spacer?
      if (prevSection.get('type') === NODE_TYPE_SECTION_SPACER) {
        const spacerSectionId = prevSection.get('id');
        prevSection = editPipeline.getPrevSibling(spacerSectionId);
        editPipeline.delete(spacerSectionId);
      }
      // overloading prevSection to mean 'prevParagraph' I know, I know...
      if (!editPipeline.canFocusNode(prevSection.get('id'))) {
        prevSection = editPipeline.getLastChild(prevSection.get('id'))
      }
    }
    if (prevSection.get('type') === NODE_TYPE_OL) {
      // merge OLs?
      editPipeline.mergeSections(prevSection, selectedOl);
      const lastLi = editPipeline.getLastChild(prevSection.get('id'));
      return [lastLi.get('id'), lastLi.get('content').length];
    }
    // convert 1st LI to P, H1, H2
    const wasOnlyChild = editPipeline.isOnlyChild(selectedNodeId);
    editPipeline.mergeParagraphs(prevSection.get('id'), selectedNodeId);
    if (wasOnlyChild) {
      const section = editPipeline.getSection(selectedOl.get('id'));
      // delete empty OL
      editPipeline.delete(selectedOl.get('id'))
      if (editPipeline.isOnlyChild(selectedOl.get('id'))) {
        // delete empty section
        editPipeline.delete(section.get('id'))
      }
    }
    return [prevSection.get('id'), prevSection.get('content').length];
  }
  // merge LIs within the same list
  const prevSibling = editPipeline.getPrevSibling(selectedNodeId);
  editPipeline.mergeParagraphs(prevSibling.get('id'), selectedNodeId);
  return [prevSibling.get('id'), prevSibling.get('content').length];
}

export function handleEnterList(editPipeline, selectedNodeId, contentLeft, contentRight) {
  if (cleanText(contentLeft).length === 0 && editPipeline.isLastChild(selectedNodeId)) {
    // create a P tag after the OL - only if empty LI is last child (allows empty LIs in the middle of list)
    const olId = editPipeline.getParent(selectedNodeId).get('id');
    const wasOnlyChild = editPipeline.isOnlyChild(selectedNodeId);
    editPipeline.delete(selectedNodeId);
    const pId = editPipeline.insertSubSectionAfter(olId, NODE_TYPE_P, contentRight);
    if (wasOnlyChild) {
      editPipeline.delete(olId);
    }
    return pId;
  }
  editPipeline.update(editPipeline.getNode(selectedNodeId).set('content', contentLeft));
  return editPipeline.insertSubSectionAfter(selectedNodeId, NODE_TYPE_LI, contentRight);
}

export function insertList(editPipeline, selectedNodeId) {
  const olId = editPipeline.insertSubSectionAfter(selectedNodeId, NODE_TYPE_OL);
  const focusNodeId = editPipeline.insert(olId, NODE_TYPE_LI, 0);
  editPipeline.delete(selectedNodeId);
  return focusNodeId;
}