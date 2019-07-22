import { NODE_TYPE_SECTION_QUOTE } from '../../common/constants';

export function insertQuote(editPipeline, selectedNodeId) {
  const selectedSectionId = editPipeline.getSection(selectedNodeId).get('id');
  editPipeline.splitSection(selectedSectionId, selectedNodeId);
  const newSectionId = editPipeline.insertSectionAfter(
    selectedSectionId,
    NODE_TYPE_SECTION_QUOTE,
  );
  return newSectionId;
}
