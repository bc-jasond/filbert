import { NODE_TYPE_SECTION_SPACER } from '../../common/constants';

export function handleBackspaceSpacer() {}
export function handleEnterSpacer() {}
export function insertSpacer(editPipeline, selectedNodeId) {
  const selectedSectionId = editPipeline.getSection(selectedNodeId).get('id');
  const placeholderParagraphWasOnlyChild = editPipeline.isOnlyChild(selectedNodeId);
  editPipeline.splitSection(selectedSectionId, selectedNodeId);
  const newSectionId = editPipeline.insertSectionAfter(
    selectedSectionId,
    NODE_TYPE_SECTION_SPACER,
  );
  //editPipeline.delete(selectedNodeId);
  if (placeholderParagraphWasOnlyChild) {
    //editPipeline.delete(selectedSectionId);
  }
  return editPipeline.getNextFocusNodeId(newSectionId);
}