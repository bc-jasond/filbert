import { stopAndPrevent } from '../../common/utils';
import { isCollapsed, isControlKey } from '../../common/dom.mjs';
import {
  deleteSelection,
  doDeleteMultiNode,
  doDeleteSingleNode,
} from '../editor-commands/delete.mjs';
import { syncToDom } from '../editor-commands/dom-sync';
import { NODE_CONTENT } from '@filbert/document';

export async function handleSyncToDom({
  evt,
  selectionOffsets,
  documentModel,
  historyManager,
  commitUpdates,
}) {
  // don't send updates for control keys
  if (
    isControlKey(evt.keyCode) ||
    // stopped by another handler like Backspace or Enter
    evt.defaultPrevented ||
    // contentEditable is not the srcTarget
    evt.target.id !== 'filbert-edit-container'
  ) {
    return false;
  }
  stopAndPrevent(evt);

  let historyLogEntries;
  ({ documentModel, historyLogEntries } = deleteSelection({
    documentModel,
    historyManager,
    selectionOffsets,
  }));

  // sync keystroke to DOM
  let historyEntriesSyncToDom;
  let executeSelectionOffsets;
  ({
    documentModel,
    historyLogEntries: historyEntriesSyncToDom,
    selectionOffsets: executeSelectionOffsets,
  } = syncToDom(documentModel, selectionOffsets, evt));
  historyLogEntries.push(...historyEntriesSyncToDom);

  // assumes content update (of one char) on a single node, only create an entry every so often
  if (historyLogEntries.length === 1) {
    historyManager.appendToHistoryLogWhenNCharsAreDifferent({
      selectionOffsets: executeSelectionOffsets,
      historyLogEntries,
      comparisonKey: NODE_CONTENT,
    });
  } else {
    // we did more than a simple content update to one node, save an entry
    historyManager.appendToHistoryLog({
      selectionOffsets: executeSelectionOffsets,
      historyLogEntries,
    });
  }

  // NOTE: Calling setState (via commitUpdates) here will force all changed nodes to rerender.
  //  The browser will then place the caret at the beginning of the textContent??? 😞 so we place it back with JS...
  await commitUpdates(documentModel, executeSelectionOffsets);
  return true;
}
