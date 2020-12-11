import { KEYCODE_X } from '@filbert/constants';

import { getHighlightedSelectionOffsets } from '../../common/dom';
import { stopAndPrevent } from '../../common/utils';
import { doDelete } from '../editor-commands/delete';

export function isCutEvent(evt) {
  return (
    evt.type === 'cut' ||
    ((evt.metaKey || evt.ctrlKey) && evt.keyCode === KEYCODE_X)
  );
}

let cutHistoryState = [];
let unexecuteSelectionOffsets;
let executeSelectionOffsetsInternal;

export async function handleCut({
  evt,
  selectionOffsets: selectionOffsetsArg,
  documentModel,
  historyManager,
  commitUpdates,
  closeAllEditContentMenus,
}) {
  if (!isCutEvent(evt)) {
    return;
  }
  const selectionOffsets =
    selectionOffsetsArg || getHighlightedSelectionOffsets();
  const { caretStart, caretEnd } = selectionOffsets;
  // if we're coming from "keydown" - check for a highlighted selection and delete it, then bail
  // we'll come back through from "cut" with clipboard data...
  if (evt.type !== 'cut') {
    // save these to pass to commitUpdates for undo history
    unexecuteSelectionOffsets = selectionOffsets;
    if (caretStart !== caretEnd) {
      const { historyState, executeSelectionOffsets } = doDelete(
        documentModel,
        selectionOffsets
      );
      executeSelectionOffsetsInternal = executeSelectionOffsets;
      cutHistoryState.push(...historyState);
    }
    return true;
  }
  // NOTE: have to manually set selection string into clipboard since we're cancelling the event
  const selectionString = document.getSelection().toString();
  console.debug('CUT selection', selectionString);
  evt.clipboardData.setData('text/plain', selectionString);

  historyManager.appendToHistoryLog({
    executeSelectionOffsets: executeSelectionOffsetsInternal,
    unexecuteSelectionOffsets,
    historyState: cutHistoryState,
  });
  // NOTE: if we stopPropagation and preventDefault on the 'keydown' event, they'll cancel the 'cut' event too
  // so don't move this up
  stopAndPrevent(evt);
  cutHistoryState = [];

  // for commitUpdates() -> setCaret()
  await closeAllEditContentMenus();
  await commitUpdates(executeSelectionOffsetsInternal);
  return true;
}
