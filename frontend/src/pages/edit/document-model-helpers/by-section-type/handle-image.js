import { NODE_TYPE_IMAGE } from '../../../../common/constants';

export function insertPhoto(documentModel, selectedNodeId, sectionMeta) {
  const selectedSectionId = documentModel.getSection(selectedNodeId).get('id');
  documentModel.splitSection(selectedSectionId, selectedNodeId);
  const newSectionId = documentModel.insertSectionAfter(
    selectedSectionId,
    NODE_TYPE_IMAGE,
    '',
    sectionMeta,
  );
  return newSectionId;
}
