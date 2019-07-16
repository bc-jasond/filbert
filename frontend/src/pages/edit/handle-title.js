import { NODE_TYPE_P, NODE_TYPE_SECTION_CONTENT } from '../../common/constants';

export function handleBackspaceTitle() {}
/**
 * insert a new P tag (and a Content Section if the next section isn't one)
 */
export function handleEnterTitle(editPipeline, selectedNodeId, contentLeft, contentRight) {
  editPipeline.update(editPipeline.getNode(selectedNodeId).set('content', contentLeft));
  const nextSibling = editPipeline.getNextSibling(selectedNodeId);
  let nextSiblingId;
  if (nextSibling.get('type') === NODE_TYPE_SECTION_CONTENT) {
    nextSiblingId = nextSibling.get('id');
  } else {
    // create a ContentSection
    nextSiblingId = editPipeline.insertSectionAfter(selectedNodeId, NODE_TYPE_SECTION_CONTENT);
  }
  // add to existing content section
  return editPipeline.insert(nextSiblingId, NODE_TYPE_P, 0, contentRight);
}

export function insertH1() {}

export function insertH2() {}