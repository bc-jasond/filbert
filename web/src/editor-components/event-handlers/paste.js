import { KEYCODE_V } from '@filbert/constants';
import {
  getHighlightedSelectionOffsets,
  isCollapsed,
} from '../../common/dom.mjs';
import { stopAndPrevent } from '../../common/utils';
import { deleteSelection } from '../editor-commands/delete.mjs';
import { doPaste } from '../editor-commands/paste';

let documentModelLocal;
// for a highlight-and-paste, this stores both the delete and paste history into one atomic unit
let historyLogEntriesPaste = [];
// update caret offsets after delete, use those for paste
let selectionOffsetsDelete;

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
}) {
  // NOTE: this handler needs to pass through twice on a "paste" event
  // 1st: on "keydown" - this is to handle deleting selected text TODO: why? let the keydown noop
  // 2nd: on "paste" - now that the selection is clear, paste in the text
  if (!isPasteEvent(evt)) {
    return false;
  }

  const selectionOffsets =
    selectionOffsetsArg || getHighlightedSelectionOffsets();
  //const {startNodeId, caretStart} = selectionOffsets;
  const caretIsCollapsed = isCollapsed(selectionOffsets);
  let historyLogEntries;
  let executeSelectionOffsets;
  // if we're coming from "keydown" - check for a highlighted selection and delete it, then bail
  // we'll come back through from "paste" with clipboard data...
  if (evt.type !== 'paste') {
    if (!caretIsCollapsed) {
      ({
        documentModel: documentModelLocal,
        historyLogEntries,
      } = deleteSelection({ documentModel, historyManager, selectionOffsets }));
      historyLogEntriesPaste.push(...historyLogEntries);
      //await commitUpdates(documentModelLocal, {startNodeId, caretStart});
    }
    return true;
  }
  // NOTE: if these get called on the 'keydown' event, they'll cancel the 'paste' event
  stopAndPrevent(evt);

  ({
    documentModel: documentModelLocal,
    selectionOffsets: executeSelectionOffsets,
    historyLogEntries,
  } = doPaste(
    documentModelLocal || documentModel,
    selectionOffsets,
    evt.clipboardData
  ));
  historyLogEntriesPaste.push(...historyLogEntries);
  // TODO: paste into Meta Type nodes isn't supported
  // TODO: is this a valid state for this code anymore?
  if (!executeSelectionOffsets) {
    console.error('PASTE - executeSelectionOffsets is falsy?');
  }
  // add history entry
  historyManager.appendToHistoryLog({
    selectionOffsets: executeSelectionOffsets,
    historyLogEntries: historyLogEntriesPaste,
  });

  historyLogEntriesPaste = [];
  // for commitUpdates() -> setCaret()
  await commitUpdates(documentModelLocal, executeSelectionOffsets);
  documentModelLocal = undefined;
  return true;
}
