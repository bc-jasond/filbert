import {
  assertValidDomSelectionOrThrow,
  findFirstDifferentWordFromDom,
} from '../../../common/dom';
import { getCharFromEvent } from '../../../common/utils';
import { adjustSelectionOffsetsAndCleanup } from '../selection-helpers';

export function syncToDom(documentModel, selectionOffsets, evt) {
  assertValidDomSelectionOrThrow(selectionOffsets);
  const { caretStart, startNodeId } = selectionOffsets;
  console.debug('To DOM SYNC', startNodeId, 'offset', caretStart);

  const newChar = getCharFromEvent(evt);
  if (newChar.length > 1) {
    console.warn(
      'syncToDom() char length greater than 1 ?',
      newChar,
      newChar.length
    );
  }

  let selectedNodeMap = documentModel.getNode(startNodeId);
  const contentBeforeUpdate = selectedNodeMap.get('content') || '';
  const updatedContentMap = `${contentBeforeUpdate.slice(
    0,
    caretStart
  )}${newChar}${contentBeforeUpdate.slice(caretStart)}`;

  console.info(
    'To DOM SYNC diff: ',
    caretStart,
    ' diffLen: ',
    newChar.length,
    'length: ',
    updatedContentMap.length
  );
  selectedNodeMap = selectedNodeMap.set('content', updatedContentMap);
  // if paragraph has selections, adjust starts and ends of any that fall on or after the current caret position
  selectedNodeMap = adjustSelectionOffsetsAndCleanup(
    selectedNodeMap,
    contentBeforeUpdate,
    caretStart,
    newChar.length
  );
  const executeSelectionOffsets = {
    startNodeId,
    caretStart: caretStart + newChar.length,
  };
  const historyState = documentModel.update(selectedNodeMap);

  return { executeSelectionOffsets, historyState };
}

function replaceWordFromSpellcheck(
  documentModel,
  startNodeId,
  contentBeforeUpdate
) {
  // find the word that changed and it's offset in the content
  const { diffStart, beforeWord, domWord } = findFirstDifferentWordFromDom(
    startNodeId,
    contentBeforeUpdate
  );
  // wholesale replace the word
  const updatedContent = `${contentBeforeUpdate.slice(
    0,
    diffStart
  )}${domWord}${contentBeforeUpdate.slice(diffStart + beforeWord.length)}`;
  let selectedNodeMap = documentModel
    .getNode(startNodeId)
    .set('content', updatedContent);
  // adjust paragraph selections, if necessary
  selectedNodeMap = adjustSelectionOffsetsAndCleanup(
    selectedNodeMap,
    contentBeforeUpdate,
    diffStart,
    domWord.length - beforeWord.length
  );
  // place caret at end of new word
  const executeSelectionOffsets = {
    startNodeId,
    caretStart: diffStart + domWord.length,
  };
  const historyState = documentModel.update(selectedNodeMap);
  return { executeSelectionOffsets, historyState };
}

export function syncFromDom(documentModel, selectionOffsets, evt) {
  assertValidDomSelectionOrThrow(selectionOffsets);
  const { caretStart, startNodeId } = selectionOffsets;
  console.info('From DOM SYNC', startNodeId, 'offset', caretStart);
  let selectedNodeMap = documentModel.getNode(startNodeId);
  const contentBeforeUpdate = selectedNodeMap.get('content') || '';

  // NOTE: following for emojis keyboard insert only...
  const { data: emoji, inputType } = evt;

  // this means a word was replaced by the spellchecker
  if (inputType === 'insertReplacementText') {
    return replaceWordFromSpellcheck(
      documentModel,
      startNodeId,
      contentBeforeUpdate
    );
  }
  // if there's no emoji then we're done, only emoji and spellcheck are sync'd back from the DOM, everything else is intercepted before
  if (!emoji) {
    return {};
  }

  const updatedContentMap = `${contentBeforeUpdate.slice(
    0,
    caretStart - emoji.length
  )}${emoji}${contentBeforeUpdate.slice(caretStart - emoji.length)}`;
  // since this is called after the content has been updated, subtract the length of the emoji
  // from the start because the adjustSelectionOffsetsAndCleanup function expects to be processing before-update
  const beforeUpdateCaretStart = caretStart - emoji.length;

  console.debug(
    'From DOM SYNC diff - this should be an emoji: ',
    emoji,
    ' caret start: ',
    beforeUpdateCaretStart,
    ' diffLen: ',
    emoji.length,
    'length: ',
    updatedContentMap.length
  );
  selectedNodeMap = selectedNodeMap.set('content', updatedContentMap);
  // if paragraph has selections, adjust starts and ends of any that fall on or after the current caret position
  selectedNodeMap = adjustSelectionOffsetsAndCleanup(
    selectedNodeMap,
    contentBeforeUpdate,
    beforeUpdateCaretStart,
    emoji.length
  );
  const executeSelectionOffsets = { startNodeId, caretStart };
  const historyState = documentModel.update(selectedNodeMap);

  // return original caretStart for correct setCaret() positioning
  return { executeSelectionOffsets, historyState };
}
