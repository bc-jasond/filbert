/* eslint-disable import/prefer-default-export */
import { cleanTextOrZeroLengthPlaceholder } from '../../../common/utils';
import { handleEnterMetaType } from './handle-meta-type';
import { handleEnterTextType } from './handle-text-type';

/**
 * @returns startNodeId|undefined string i.e. "4eb7"
 */
export function doSplit(documentModel, selectionOffsets) {
  const { caretStart, startNodeId } = selectionOffsets;
  if (startNodeId === 'null' || !startNodeId) {
    console.warn('doSplit() bad selection, no id ', startNodeId);
    return null;
  }
  if (documentModel.isMetaType(startNodeId)) {
    console.debug('doSplit() MetaType');
    return handleEnterMetaType(documentModel, startNodeId);
  }

  console.debug('doSplit()', startNodeId, caretStart);
  // split selectedNodeContent at caret
  const selectedNodeContent = cleanTextOrZeroLengthPlaceholder(
    documentModel.getNode(startNodeId).get('content')
  );
  return handleEnterTextType(
    documentModel,
    startNodeId,
    caretStart,
    selectedNodeContent
  );
}
