import { getNodeId } from '../../../common/dom';
import { getCharFromEvent } from '../../../common/utils';
import { handleDomSyncCode } from './by-section-type/handle-code';
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
  
  // TODO: handle start != end (range is not collapsed)
  const newChar = getCharFromEvent(evt);
  const diffLength = newChar.length;
  
  switch (selectedNode.tagName) {
    case 'PRE': {
      console.debug('To DOM SYNC PRE ', selectedNode);
      handleDomSyncCode(documentModel, selectedNodeId, newChar, caretPositionStart);
      break;
    }
    default: {
      let selectedNodeMap = documentModel.getNode(selectedNodeId);
      const beforeContentMap = selectedNodeMap.get('content') || '';
      const updatedContentMap = `${beforeContentMap.slice(0, caretPositionStart)}${newChar}${beforeContentMap.slice(caretPositionStart)}`;
      
      console.info('To DOM SYNC diff: ', caretPositionStart, ' diffLen: ', diffLength, 'length: ', updatedContentMap.length);
      selectedNodeMap = selectedNodeMap.set('content', updatedContentMap);
      // if paragraph has selections, adjust starts and ends of any that fall on or after the current caret position
      selectedNodeMap = adjustSelectionOffsetsAndCleanup(selectedNodeMap, beforeContentMap, caretPositionStart, diffLength);
      documentModel.update(selectedNodeMap);
    }
  }
  
  return [selectedNodeId, caretPositionStart + diffLength];
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
  // TODO: handle start != end (range is not collapsed)
  switch (selectedNode.tagName) {
    case 'PRE': {
      console.debug('From DOM SYNC PRE ', selectedNode);
      handleDomSyncCode(documentModel, selectedNodeId, emoji, caretPositionStart - emoji.length);
      break;
    }
    default: {
      let selectedNodeMap = documentModel.getNode(selectedNodeId);
      const beforeContentMap = selectedNodeMap.get('content') || '';
      const updatedContentMap = `${beforeContentMap.slice(0, caretPositionStart - emoji.length)}${emoji}${beforeContentMap.slice(caretPositionStart - emoji.length)}`;
      const diffLength = emoji.length;
      
      console.debug('From DOM SYNC diff - this should be an emoji: ', emoji, ' caret start: ', caretPositionStart, ' diffLen: ', diffLength, 'length: ', updatedContentMap.length);
      selectedNodeMap = selectedNodeMap.set('content', updatedContentMap);
      // if paragraph has selections, adjust starts and ends of any that fall on or after the current caret position
      selectedNodeMap = adjustSelectionOffsetsAndCleanup(selectedNodeMap, beforeContentMap, caretPositionStart, diffLength);
      documentModel.update(selectedNodeMap);
    }
  }
  
  return [selectedNodeId, caretPositionStart];
}