import {
  NODE_TYPE_LI,
  NODE_TYPE_P,
  NODE_TYPE_PRE,
  NODE_TYPE_H1,
  NODE_TYPE_H2
} from '../../../common/constants';
import { getNodeId, getNodeType } from '../../../common/dom';
import { cleanTextOrZeroLengthPlaceholder } from '../../../common/utils';
import { handleEnterCode } from './by-section-type/handle-code';
import { handleEnterList } from './by-section-type/handle-list';
import { handleEnterTextType } from './handle-text-type';
import { handleEnterTitle } from './by-section-type/handle-title';

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
