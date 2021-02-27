import { stopAndPrevent } from '../../common/utils';
import { isCollapsed, isControlKey } from '../../common/dom.mjs';
import {
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

  const historyState = [];
  // select-and-type ?? delete selection first
  const { endNodeId } = selectionOffsets;
  const caretIsCollapsed = isCollapsed(selectionOffsets);
  if (!caretIsCollapsed) {
    let historyStateDelete;
    if (endNodeId) {
      ({ historyStateDelete } = doDeleteMultiNode(
        documentModel,
        historyManager,
        selectionOffsets
      ));
    } else {
      ({ historyStateDelete } = doDeleteSingleNode(
        documentModel,
        historyManager,
        selectionOffsets
      ));
    }
    historyState.push(...historyStateDelete);
  }
  // sync keystroke to DOM
  const {
    historyState: historyStateSync,
    selectionOffsets: executeSelectionOffsets,
  } = syncToDom(documentModel, selectionOffsets, evt);
  historyState.push(...historyStateSync);

  // assumes content update (of one char) on a single node, only create an entry every so often
  if (historyState.length === 1) {
    historyManager.appendToHistoryLogWhenNCharsAreDifferent({
      selectionOffsets: executeSelectionOffsets,
      historyState,
      comparisonKey: NODE_CONTENT,
    });
  } else {
    // we did more than a simple content update to one node, save an entry
    historyManager.appendToHistoryLog({
      selectionOffsets: executeSelectionOffsets,
      historyState,
    });
  }

  // NOTE: Calling setState (via commitUpdates) here will force all changed nodes to rerender.
  //  The browser will then place the caret at the beginning of the textContent??? 😞 so we place it back with JS...
  await commitUpdates(executeSelectionOffsets);
  return true;
}
