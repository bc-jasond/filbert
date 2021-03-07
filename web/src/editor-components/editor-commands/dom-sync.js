import { getNode } from '@filbert/linked-list';
import { contentClean, update, NODE_CONTENT } from '@filbert/document';
import {
  assertValidDomSelectionOrThrow,
  findFirstDifferentWordFromDom,
} from '../../common/dom.mjs';
import { getCharFromEvent } from '../../common/utils';

export function syncToDom(documentModel, selectionOffsets, evt) {
  assertValidDomSelectionOrThrow(selectionOffsets);
  const { caretStart, startNodeId } = selectionOffsets;
  console.debug('To DOM SYNC', startNodeId, 'offset', caretStart, evt);

  const newChar = getCharFromEvent(evt);
  if (newChar.length === 0) {
    console.warn('syncToDom() skipping 0 length char', evt);
  }
  if (newChar.length > 1) {
    console.warn(
      'syncToDom() char length greater than 1 ?',
      newChar,
      newChar.length
    );
  }

  let startNode = getNode(documentModel, startNodeId);
  const contentBeforeUpdate = contentClean(startNode);
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
  startNode = startNode.set(NODE_CONTENT, updatedContentMap);
  /* if paragraph has selections, adjust starts and ends of any that fall on or after the current caret position
  startNode.formatSelections.adjustSelectionOffsetsAndCleanup(
    updatedContentMap.length,
    contentBeforeUpdate.length,
    caretStart,
    newChar.length
  );*/
  const executeSelectionOffsets = {
    startNodeId,
    caretStart: caretStart + newChar.length,
  };
  let historyLogEntry;
  ({ documentModel, historyLogEntry } = update(documentModel, startNode));
  return {
    documentModel,
    selectionOffsets: executeSelectionOffsets,
    historyLogEntries: [historyLogEntry],
  };
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
  // use the "before" word offsets for beginning and ending content, replace the word itself with the "dom" word
  // this will handle any case where words are different lengths
  const updatedContent = `${contentBeforeUpdate.slice(
    0,
    diffStart
  )}${domWord}${contentBeforeUpdate.slice(diffStart + beforeWord.length)}`;
  let startNode = getNode(documentModel, startNodeId);
  startNode = startNode.set(NODE_CONTENT, updatedContent);
  /* adjust paragraph selections, if necessary
  startNode.formatSelections.adjustSelectionOffsetsAndCleanup(
    updatedContent.length,
    contentBeforeUpdate.length,
    diffStart,
    domWord.length - beforeWord.length
  );*/
  // place caret at end of new word
  const selectionOffsets = {
    startNodeId,
    caretStart: diffStart + domWord.length,
  };
  let historyLogEntry;
  ({ documentModel, historyLogEntry } = update(documentModel, startNode));
  return {
    documentModel,
    selectionOffsets,
    historyLogEntries: [historyLogEntry],
  };
}

export function syncFromDom(documentModel, selectionOffsets, evt) {
  assertValidDomSelectionOrThrow(selectionOffsets);
  const { caretStart, startNodeId } = selectionOffsets;
  console.info('From DOM SYNC', startNodeId, 'offset', caretStart);
  let startNode = getNode(documentModel, startNodeId);
  const contentBeforeUpdate = contentClean(startNode);

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
  startNode = startNode.set(NODE_CONTENT, updatedContentMap);
  /* if paragraph has selections, adjust starts and ends of any that fall on or after the current caret position
  startNode.formatSelections.adjustSelectionOffsetsAndCleanup(
    updatedContentMap.length,
    contentBeforeUpdate.length,
    beforeUpdateCaretStart,
    emoji.length
  );*/
  const executeSelectionOffsets = { startNodeId, caretStart };
  let historyLogEntry;
  ({ documentModel, historyLogEntry } = update(documentModel, startNode));

  // return original caretStart for correct setCaret() positioning
  return {
    selectionOffsets: executeSelectionOffsets,
    historyLogEntries: [historyLogEntry],
  };
}
