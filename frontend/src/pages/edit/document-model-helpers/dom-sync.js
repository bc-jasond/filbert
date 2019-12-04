import { getNodeId } from '../../../common/dom';
import { getCharFromEvent } from '../../../common/utils';
import { adjustSelectionOffsetsAndCleanup } from '../selection-helpers';

export function syncToDom(documentModel, selectionOffsets, evt) {
  const [
    [caretPositionStart, _, selectedNode],
  ] = selectionOffsets;
  const selectedNodeId = getNodeId(selectedNode);
  if (selectedNodeId === 'null' || !selectedNodeId) {
    console.warn('To DOM SYNC - bad selection, no id ', selectedNode);
    return [];
  }
  console.info('To DOM SYNC', selectedNode, 'offset', caretPositionStart);
  
  const newChar = getCharFromEvent(evt);
  if (newChar.length > 1) {
    console.warn("syncToDom() char length greater than 1 ?", newChar, newChar.length);
  }
  
  let selectedNodeMap = documentModel.getNode(selectedNodeId);
  const beforeContentMap = selectedNodeMap.get('content') || '';
  const updatedContentMap = `${beforeContentMap.slice(0, caretPositionStart)}${newChar}${beforeContentMap.slice(caretPositionStart)}`;
  
  console.info('To DOM SYNC diff: ', caretPositionStart, ' diffLen: ', newChar.length, 'length: ', updatedContentMap.length);
  selectedNodeMap = selectedNodeMap.set('content', updatedContentMap);
  // if paragraph has selections, adjust starts and ends of any that fall on or after the current caret position
  selectedNodeMap = adjustSelectionOffsetsAndCleanup(selectedNodeMap, beforeContentMap, caretPositionStart, newChar.length);
  documentModel.update(selectedNodeMap);
  
  return [selectedNodeId, caretPositionStart + newChar.length];
}

export function syncFromDom(documentModel, selectionOffsets, evt) {
  const [
    [caretPositionStart, _, selectedNode],
  ] = selectionOffsets;
  const selectedNodeId = getNodeId(selectedNode);
  if (selectedNodeId === 'null' || !selectedNodeId) {
    console.warn('From DOM SYNC - bad selection, no id ', selectedNode);
    return [];
  }
  console.info('From DOM SYNC', selectedNode, 'offset', caretPositionStart);
  
  // NOTE: following for emojis keyboard insert only...
  const emoji = getCharFromEvent(evt);
  
  let selectedNodeMap = documentModel.getNode(selectedNodeId);
  const beforeContentMap = selectedNodeMap.get('content') || '';
  const updatedContentMap = `${beforeContentMap.slice(0, caretPositionStart - emoji.length)}${emoji}${beforeContentMap.slice(caretPositionStart - emoji.length)}`;
  
  console.debug('From DOM SYNC diff - this should be an emoji: ', emoji, ' caret start: ', caretPositionStart, ' diffLen: ', emoji.length, 'length: ', updatedContentMap.length);
  selectedNodeMap = selectedNodeMap.set('content', updatedContentMap);
  // if paragraph has selections, adjust starts and ends of any that fall on or after the current caret position
  selectedNodeMap = adjustSelectionOffsetsAndCleanup(selectedNodeMap, beforeContentMap, caretPositionStart, emoji.length);
  documentModel.update(selectedNodeMap);
  
  return [selectedNodeId, caretPositionStart];
}