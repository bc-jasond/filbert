import { NODE_TYPE_SECTION_QUOTE } from '../../../common/constants';

export function insertQuote(documentModel, selectedNodeId) {
  const selectedSectionId = documentModel.getSection(selectedNodeId).get('id');
  documentModel.splitSection(selectedSectionId, selectedNodeId);
  const newSectionId = documentModel.insertSectionAfter(
    selectedSectionId,
    NODE_TYPE_SECTION_QUOTE,
  );
  return newSectionId;
}
