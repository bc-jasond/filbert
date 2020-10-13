import { stopAndPrevent } from '../../common/utils';
import { isControlKey } from '../../common/dom';
import { doDelete } from '../editor-commands/delete';
import { syncToDom } from '../editor-commands/dom-sync';

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
    evt.target.id !== 'filbert-edit-container' //||
    // These should be handled by the consumer...
    // // ignore "paste" - propagation hasn't been stopped because it would cancel the respective "paste", "cut" events
    // pasteHistoryState ||
    // // ignore "cut"
    // cutHistoryState ||
    // // invalid selection
    // !isValidDomSelection(selectionOffsets)
  ) {
    return false;
  }
  stopAndPrevent(evt);

  const historyState = [];
  // select-and-type ?? delete selection first
  if (selectionOffsets.caretStart !== selectionOffsets.caretEnd) {
    const { historyState: historyStateDelete } = doDelete(
      documentModel,
      selectionOffsets
    );
    historyState.push(...historyStateDelete);
  }
  // sync keystroke to DOM
  const { historyState: historyStateSync, executeSelectionOffsets } = syncToDom(
    documentModel,
    selectionOffsets,
    evt
  );
  historyState.push(...historyStateSync);

  // assumes content update (of one char) on a single node, only create an entry every so often
  if (historyState.length === 1) {
    historyManager.appendToHistoryLogWhenNCharsAreDifferent({
      unexecuteSelectionOffsets: selectionOffsets,
      executeSelectionOffsets,
      historyState,
      comparisonPath: ['content'],
    });
  } else {
    // we did more than a simple content update to one node, save an entry
    historyManager.flushPendingHistoryLogEntry();
    historyManager.appendToHistoryLog({
      unexecuteSelectionOffsets: selectionOffsets,
      executeSelectionOffsets,
      historyState,
    });
  }

  // NOTE: Calling setState (via commitUpdates) here will force all changed nodes to rerender.
  //  The browser will then place the caret at the beginning of the textContent??? 😞 so we place it back with JS...
  await commitUpdates(executeSelectionOffsets);
  return true;
}
