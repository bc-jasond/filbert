import { KEYCODE_V } from '@filbert/constants';
import { getHighlightedSelectionOffsets } from '../../common/dom';
import { stopAndPrevent } from '../../common/utils';
import { doDelete } from '../editor-commands/delete';
import { doPaste } from '../editor-commands/paste';

let unexecuteSelectionOffsets;
// for a highlight-and-paste, this stores both the delete and paste history into one atomic unit
let pasteHistoryState = [];

// handle both the "paste" event and keyboard shortcut
export function isPasteEvent(evt) {
  return (
    evt.type === 'paste' ||
    ((evt.metaKey || evt.ctrlKey) && evt.keyCode === KEYCODE_V)
  );
}

export async function handlePaste({
  evt,
  selectionOffsets: selectionOffsetsArg,
  documentModel,
  historyManager,
  commitUpdates,
  closeAllEditContentMenus,
}) {
  // NOTE: this handler needs to pass through twice on a "paste" event
  // 1st: on "keydown" - this is to handle deleting selected text TODO: why? let the keydown noop
  // 2nd: on "paste" - now that the selection is clear, paste in the text
  if (!isPasteEvent(evt)) {
    return false;
  }

  const selectionOffsets =
    selectionOffsetsArg || getHighlightedSelectionOffsets();
  // if we're coming from "keydown" - check for a highlighted selection and delete it, then bail
  // we'll come back through from "paste" with clipboard data...
  if (evt.type !== 'paste') {
    // for undo (unexecute) history - need to store the "first" selections, aka before the delete operation
    unexecuteSelectionOffsets = selectionOffsets;
    if (selectionOffsets.caretStart !== selectionOffsets.caretEnd) {
      const { historyState } = doDelete(documentModel, selectionOffsets);
      pasteHistoryState.push(...historyState);
    }
    return true;
  }
  // NOTE: if these get called on the 'keydown' event, they'll cancel the 'paste' event
  stopAndPrevent(evt);

  const { selectionOffsets: executeSelectionOffsets, historyState } = doPaste(
    documentModel,
    selectionOffsets,
    evt.clipboardData
  );
  pasteHistoryState.push(...historyState);
  // TODO: paste into Meta Type nodes isn't supported
  // TODO: is this a valid state for this code anymore?
  if (!executeSelectionOffsets) {
    console.error('PASTE - executeSelectionOffsets is falsy?');
  }
  // add history entry
  historyManager.appendToHistoryLog({
    selectionOffsets: executeSelectionOffsets,
    historyState: pasteHistoryState,
  });

  pasteHistoryState = [];
  // for commitUpdates() -> setCaret()
  //await closeAllEditContentMenus();
  await commitUpdates(executeSelectionOffsets);
  return true;
}
