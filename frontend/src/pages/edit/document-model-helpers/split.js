import { cleanTextOrZeroLengthPlaceholder } from '../../../common/utils';
import { handleEnterTextType } from './handle-text-type';

/**
 * @returns focusNodeId|undefined string i.e. "4eb7"
 */
export function doSplit(documentModel, selectionOffsets) {
  const [
    [caretPosition, _, selectedNodeId],
  ] = selectionOffsets;
  if (selectedNodeId === 'null' || !selectedNodeId) {
    console.warn('doSplit() bad selection, no id ', selectedNodeId);
    return;
  }
  if (documentModel.isMetaType(selectedNodeId)) {
    console.info("doSplit() TODO: support MetaType sections")
  }
  
  console.info('doSplit()', selectedNodeId, caretPosition);
  // split selectedNodeContent at caret
  const selectedNodeContent = cleanTextOrZeroLengthPlaceholder(documentModel.getNode(selectedNodeId).get('content'));
  return handleEnterTextType(documentModel, selectedNodeId, caretPosition, selectedNodeContent);
}
