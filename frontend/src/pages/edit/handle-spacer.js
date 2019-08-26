import { NODE_TYPE_SECTION_SPACER } from '../../common/constants';

export function insertSpacer(documentModel, selectedNodeId) {
  const selectedSectionId = documentModel.getSection(selectedNodeId).get('id');
  documentModel.splitSection(selectedSectionId, selectedNodeId);
  const newSectionId = documentModel.inserSectionBeforeOrAfter(
    selectedSectionId,
    NODE_TYPE_SECTION_SPACER,
  );
  return documentModel.getNextFocusNodeId(newSectionId);
}