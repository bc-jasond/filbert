import { KEYCODE_X } from '@filbert/constants';
import { deleteSelection } from '../editor-commands/delete.mjs';

import {
  getHighlightedSelectionOffsets,
  isCollapsed,
} from '../../common/dom.mjs';
import { stopAndPrevent } from '../../common/utils';

export function isCutEvent(evt) {
  return (
    evt.type === 'cut' ||
    ((evt.metaKey || evt.ctrlKey) && evt.keyCode === KEYCODE_X)
  );
}

let documentModelLocal;
let selectionString = '';
let historyLogEntries;
let executeSelectionOffsets;

export async function handleCut({
  evt,
  selectionOffsets: selectionOffsetsArg,
  documentModel,
  historyManager,
  commitUpdates,
}) {
  if (!isCutEvent(evt)) {
    return;
  }

  const selectionOffsets =
    selectionOffsetsArg || getHighlightedSelectionOffsets();
  const { startNodeId, caretStart } = selectionOffsets;

  if (isCollapsed(selectionOffsets)) {
    stopAndPrevent(evt);
    return true;
  }
  // if we're coming from "keydown" - check for a highlighted selection and delete it, then bail
  // we'll come back around the horn from "cut" with clipboard data...
  if (evt.type !== 'cut') {
    selectionString = document.getSelection().toString();
    ({
      documentModel: documentModelLocal,
      historyLogEntries,
    } = deleteSelection({ documentModel, historyManager, selectionOffsets }));
    return true;
  }
  // NOTE: have to manually set selection string into clipboard since we're cancelling the event
  console.debug('CUT selection', selectionString);
  evt.clipboardData.setData('text/plain', selectionString);
  // cut is like delete, just put the caret collapsed at caretStart
  executeSelectionOffsets = { startNodeId, caretStart };
  // add delete selection history, if any
  historyManager.appendToHistoryLog({
    selectionOffsets: executeSelectionOffsets,
    historyLogEntries,
  });
  // stop and prevent browser default contenteditable behavior - we'll take it from here, thanks!
  // NOTE: if we stopPropagation and preventDefault on the 'keydown' event, they'll cancel the 'cut' event too
  // so don't move this up
  stopAndPrevent(evt);
  historyLogEntries = [];

  // for commitUpdates() -> setCaret()
  await commitUpdates(documentModelLocal, executeSelectionOffsets);
  // dont forget to unset...
  documentModelLocal = undefined;
  return true;
}
