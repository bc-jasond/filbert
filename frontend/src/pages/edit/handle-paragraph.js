import { NODE_TYPE_P } from '../../common/constants';

export function handleBackspaceParagraph() {}

export function handleEnterParagraph(editPipeline, selectedNodeId, contentLeft, contentRight) {
  editPipeline.update(editPipeline.getNode(selectedNodeId).set('content', contentLeft));
  return editPipeline.insertSubSectionAfter(selectedNodeId, NODE_TYPE_P, contentRight);
}

export function insertParagraph() {}