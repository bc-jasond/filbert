import { NODE_TYPE_SECTION_SPACER } from '../../common/constants';

export function insertSpacer(editPipeline, selectedNodeId) {
  const selectedSectionId = editPipeline.getSection(selectedNodeId).get('id');
  editPipeline.splitSection(selectedSectionId, selectedNodeId);
  const newSectionId = editPipeline.insertSectionAfter(
    selectedSectionId,
    NODE_TYPE_SECTION_SPACER,
  );
  return editPipeline.getNextFocusNodeId(newSectionId);
}