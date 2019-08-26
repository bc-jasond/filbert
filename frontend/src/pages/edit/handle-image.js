import { NODE_TYPE_SECTION_IMAGE } from '../../common/constants';

export function insertPhoto(documentModel, selectedNodeId) {
  const selectedSectionId = documentModel.getSection(selectedNodeId).get('id');
  documentModel.splitSection(selectedSectionId, selectedNodeId);
  const newSectionId = documentModel.inserSectionBeforeOrAfter(
    selectedSectionId,
    NODE_TYPE_SECTION_IMAGE,
  );
  return newSectionId;
}
