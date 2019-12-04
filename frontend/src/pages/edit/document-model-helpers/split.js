import { getNodeId } from '../../../common/dom';
import { cleanTextOrZeroLengthPlaceholder } from '../../../common/utils';
import { handleEnterTextType } from './handle-text-type';

/**
 * @returns focusNodeId|undefined string i.e. "4eb7"
 */
export function doSplit(documentModel, selectionOffsets) {
  const [
    [caretPosition, _, selectedNode],
  ] = selectionOffsets;
  const selectedNodeId = getNodeId(selectedNode);
  if (selectedNodeId === 'null' || !selectedNodeId) {
    console.warn('doSplit() bad selection, no id ', selectedNode);
    return;
  }
  if (documentModel.isMetaType(selectedNodeId)) {
    console.info("doSplit() TODO: support MetaType sections")
  }
  
  console.info('doSplit()', selectedNode, caretPosition);
  // split selectedNodeContent at caret
  const selectedNodeContent = cleanTextOrZeroLengthPlaceholder(selectedNode.textContent);
  return handleEnterTextType(documentModel, selectedNodeId, caretPosition, selectedNodeContent);
}
