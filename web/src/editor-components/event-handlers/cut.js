import { KEYCODE_X } from '@filbert/constants';

import { getHighlightedSelectionOffsets, isCollapsed } from '../../common/dom';
import { stopAndPrevent } from '../../common/utils';
import {
  doDeleteSingleNode,
  doDeleteMultiNode,
} from '../editor-commands/delete';

export function isCutEvent(evt) {
  return (
    evt.type === 'cut' ||
    ((evt.metaKey || evt.ctrlKey) && evt.keyCode === KEYCODE_X)
  );
}

let selectionString = '';
let historyState;
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
  const { endNodeId } = selectionOffsets;
  const caretIsCollapsed = isCollapsed(selectionOffsets);
  // if we're coming from "keydown" - check for a highlighted selection and delete it, then bail
  // we'll come back through from "cut" with clipboard data...
  if (evt.type !== 'cut') {
    if (!caretIsCollapsed) {
      selectionString = document.getSelection().toString();
      if (endNodeId) {
        ({
          historyState,
          selectionOffsets: executeSelectionOffsets,
        } = doDeleteMultiNode(documentModel, historyManager, selectionOffsets));
      } else {
        ({
          historyState,
          selectionOffsets: executeSelectionOffsets,
        } = doDeleteSingleNode(
          documentModel,
          historyManager,
          selectionOffsets
        ));
      }
    }
    return true;
  }
  // NOTE: have to manually set selection string into clipboard since we're cancelling the event
  console.debug('CUT selection', selectionString);
  evt.clipboardData.setData('text/plain', selectionString);

  historyManager.appendToHistoryLog({
    selectionOffsets: executeSelectionOffsets,
    historyState,
  });
  // stop and prevent browser default contenteditable behavior - we'll take it from here, thanks!
  // NOTE: if we stopPropagation and preventDefault on the 'keydown' event, they'll cancel the 'cut' event too
  // so don't move this up
  stopAndPrevent(evt);
  historyState = [];

  // for commitUpdates() -> setCaret()
  await commitUpdates(executeSelectionOffsets);
  return true;
}
