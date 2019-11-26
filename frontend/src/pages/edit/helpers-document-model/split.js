import {
  NODE_TYPE_LI,
  NODE_TYPE_P,
  NODE_TYPE_PRE,
  NODE_TYPE_SECTION_H1,
  NODE_TYPE_SECTION_H2
} from '../../../common/constants';
import { getNodeId, getNodeType } from '../../../common/dom';
import { cleanTextOrZeroLengthPlaceholder } from '../../../common/utils';
import { handleEnterCode } from '../helpers-by-section-type/handle-code';
import { handleEnterList } from '../helpers-by-section-type/handle-list';
import { handleEnterParagraph } from '../helpers-by-section-type/handle-paragraph';
import { handleEnterTitle } from '../helpers-by-section-type/handle-title';

/**
 * @returns focusNodeId|undefined string i.e. "4eb7"
 */
export function doSplit(documentModel, selectionOffsets) {
  const [
    [caretPosition, _, selectedNode],
  ] = selectionOffsets;
  const selectedNodeId = getNodeId(selectedNode);
  const selectedNodeType = getNodeType(selectedNode);
  if (selectedNodeId === 'null' || !selectedNodeId) {
    console.warn('doSplit() bad selection, no id ', selectedNode);
    return;
  }
  
  console.info('doSplit()', selectedNode, caretPosition);
  // split selectedNodeContent at caret
  const selectedNodeContent = cleanTextOrZeroLengthPlaceholder(selectedNode.textContent);
  
  switch (selectedNodeType) {
    case NODE_TYPE_PRE: {
      return handleEnterCode(documentModel, selectedNodeId, caretPosition, selectedNodeContent);
    }
    case NODE_TYPE_LI: {
      return handleEnterList(documentModel, selectedNodeId, caretPosition, selectedNodeContent);
    }
    case NODE_TYPE_P: {
      return handleEnterParagraph(documentModel, selectedNodeId, caretPosition, selectedNodeContent);
    }
    case NODE_TYPE_SECTION_H1: // fall-through
    case NODE_TYPE_SECTION_H2: {
      return handleEnterTitle(documentModel, selectedNodeId, caretPosition, selectedNodeContent);
    }
    default: {
      console.error("Can't handle ENTER!", selectedNodeType);
      return;
    }
  }
}
