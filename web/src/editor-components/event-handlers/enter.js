import { Map } from 'immutable';
import { KEYCODE_ENTER } from '@filbert/constants';

import { stopAndPrevent } from '../../common/utils';
import { doSplit } from '../editor-commands/split';

export async function handleEnter({
  evt,
  selectionOffsets,
  documentModel,
  historyManager,
  commitUpdates,
  setEditSectionNode,
}) {
  if (evt.keyCode !== KEYCODE_ENTER) {
    return false;
  }

  stopAndPrevent(evt);

  // perform editor commands
  const { selectionOffsets: executeSelectionOffsets, historyState } = doSplit(
    documentModel,
    selectionOffsets
  );
  // create history log entry
  historyManager.appendToHistoryLog({
    selectionOffsets: executeSelectionOffsets,
    historyState,
  });

  // clear current edit section node if coming from a Meta Type or caret position will be stale
  setEditSectionNode(Map());
  await commitUpdates(executeSelectionOffsets);

  return true;
}
