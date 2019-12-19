import { getCharFromEvent } from '../../../common/utils';
import { adjustSelectionOffsetsAndCleanup } from '../selection-helpers';

export function syncToDom(documentModel, selectionOffsets, evt) {
  const { startNodeCaretStart, startNodeId } = selectionOffsets;
  if (startNodeId === 'null' || !startNodeId) {
    console.warn('To DOM SYNC - bad selection, no id ', startNodeId);
    return {};
  }
  console.info('To DOM SYNC', startNodeId, 'offset', startNodeCaretStart);

  const newChar = getCharFromEvent(evt);
  if (newChar.length > 1) {
    console.warn(
      'syncToDom() char length greater than 1 ?',
      newChar,
      newChar.length
    );
  }

  let selectedNodeMap = documentModel.getNode(startNodeId);
  const beforeContentMap = selectedNodeMap.get('content') || '';
  const updatedContentMap = `${beforeContentMap.slice(
    0,
    startNodeCaretStart
  )}${newChar}${beforeContentMap.slice(startNodeCaretStart)}`;

  console.info(
    'To DOM SYNC diff: ',
    startNodeCaretStart,
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
    startNodeCaretStart,
    newChar.length
  );
  documentModel.update(selectedNodeMap);

  return {
    focusNodeId: startNodeId,
    caretOffset: startNodeCaretStart + newChar.length
  };
}

export function syncFromDom(documentModel, selectionOffsets, evt) {
  const { startNodeCaretStart, startNodeId } = selectionOffsets;
  if (startNodeId === 'null' || !startNodeId) {
    console.warn('From DOM SYNC - bad selection, no id ', startNodeId);
    return {};
  }
  console.info('From DOM SYNC', startNodeId, 'offset', startNodeCaretStart);

  // NOTE: following for emojis keyboard insert only...
  const { data: emoji } = evt;
  if (!emoji) {
    return {};
  }

  let selectedNodeMap = documentModel.getNode(startNodeId);
  const beforeContentMap = selectedNodeMap.get('content') || '';
  const updatedContentMap = `${beforeContentMap.slice(
    0,
    startNodeCaretStart - emoji.length
  )}${emoji}${beforeContentMap.slice(startNodeCaretStart - emoji.length)}`;
  // since this is called after the content has been updated, subtract the length of the emoji from the start because the adjustSelectionOffsetsAndCleanup function expects to be processing PRE-update
  const preUpdateStart = startNodeCaretStart - emoji.length;

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

  // return original startNodeCaretStart for correct setCaret() positioning
  return { focusNodeId: startNodeId, caretOffset: startNodeCaretStart };
}
