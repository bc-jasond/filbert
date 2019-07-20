import { NODE_TYPE_SECTION_IMAGE } from '../../common/constants';

export function insertPhoto(editPipeline, selectedNodeId) {
  const selectedSectionId = editPipeline.getSection(selectedNodeId).get('id');
  editPipeline.splitSection(selectedSectionId, selectedNodeId);
  const newSectionId = editPipeline.insertSectionAfter(
    selectedSectionId,
    NODE_TYPE_SECTION_IMAGE,
  );
  return newSectionId;
}
