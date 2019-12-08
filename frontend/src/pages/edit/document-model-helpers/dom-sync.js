import { getCharFromEvent } from '../../../common/utils';
import { adjustSelectionOffsetsAndCleanup } from '../selection-helpers';

export function syncToDom(documentModel, selectionOffsets, evt) {
  const [[caretPositionStart, _, selectedNodeId]] = selectionOffsets;
  if (selectedNodeId === 'null' || !selectedNodeId) {
    console.warn('To DOM SYNC - bad selection, no id ', selectedNodeId);
    return [];
  }
  console.info('To DOM SYNC', selectedNodeId, 'offset', caretPositionStart);

  const newChar = getCharFromEvent(evt);
  if (newChar.length > 1) {
    console.warn(
      'syncToDom() char length greater than 1 ?',
      newChar,
      newChar.length
    );
  }

  let selectedNodeMap = documentModel.getNode(selectedNodeId);
  const beforeContentMap = selectedNodeMap.get('content') || '';
  const updatedContentMap = `${beforeContentMap.slice(
    0,
    caretPositionStart
  )}${newChar}${beforeContentMap.slice(caretPositionStart)}`;

  console.info(
    'To DOM SYNC diff: ',
    caretPositionStart,
    ' diffLen: ',
    newChar.length,
    'length: ',
    updatedContentMap.length
  );
  selectedNodeMap = selectedNodeMap.set('content', updatedContentMap);
  // if paragraph has selections, adjust starts and ends of any that fall on or after the current caret position
  selectedNodeMap = adjustSelectionOffsetsAndCleanup(
    selectedNodeMap,
    beforeContentMap,
    caretPositionStart,
    newChar.length
  );
  documentModel.update(selectedNodeMap);

  return [selectedNodeId, caretPositionStart + newChar.length];
}

export function syncFromDom(documentModel, selectionOffsets, evt) {
  const [[caretPositionStart, _, selectedNodeId]] = selectionOffsets;
  if (selectedNodeId === 'null' || !selectedNodeId) {
    console.warn('From DOM SYNC - bad selection, no id ', selectedNodeId);
    return [];
  }
  console.info('From DOM SYNC', selectedNodeId, 'offset', caretPositionStart);

  // NOTE: following for emojis keyboard insert only...
  const emoji = evt.data;
  if (!emoji) {
    return;
  }

  let selectedNodeMap = documentModel.getNode(selectedNodeId);
  const beforeContentMap = selectedNodeMap.get('content') || '';
  const updatedContentMap = `${beforeContentMap.slice(
    0,
    caretPositionStart - emoji.length
  )}${emoji}${beforeContentMap.slice(caretPositionStart - emoji.length)}`;
  // since this is called after the content has been updated, subtract the length of the emoji from the start because the adjustSelectionOffsetsAndCleanup function expects to be processing PRE-update
  const preUpdateStart = caretPositionStart - emoji.length;

  console.debug(
    'From DOM SYNC diff - this should be an emoji: ',
    emoji,
    ' caret start: ',
    preUpdateStart,
    ' diffLen: ',
    emoji.length,
    'length: ',
    updatedContentMap.length
  );
  selectedNodeMap = selectedNodeMap.set('content', updatedContentMap);
  // if paragraph has selections, adjust starts and ends of any that fall on or after the current caret position
  selectedNodeMap = adjustSelectionOffsetsAndCleanup(
    selectedNodeMap,
    beforeContentMap,
    preUpdateStart,
    emoji.length
  );
  documentModel.update(selectedNodeMap);

  // return original caretPositionStart for correct setCaret() positioning
  return [selectedNodeId, caretPositionStart];
}
