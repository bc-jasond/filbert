import { KEYCODE_ENTER } from '@filbert/constants';

import { stopAndPrevent } from '../../common/utils';
import { doSplit } from '../editor-commands/split';
import { deleteSelection } from '../editor-commands/delete.mjs';

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
  let historyLogEntries;
  ({ documentModel, historyLogEntries } = deleteSelection({
    documentModel,
    historyManager,
    selectionOffsets,
  }));

  // perform editor commands
  let executeSelectionOffsets;
  let historyLogEntriesSplit;
  ({
    documentModel,
    selectionOffsets: executeSelectionOffsets,
    historyLogEntries: historyLogEntriesSplit,
  } = doSplit(documentModel, selectionOffsets));
  historyLogEntries.push(...historyLogEntriesSplit);

  // create history log entry
  historyManager.appendToHistoryLog({
    selectionOffsets: executeSelectionOffsets,
    historyLogEntries,
  });

  // clear current edit section node if coming from a Meta Type or caret position will be stale
  setEditSectionNode();
  await commitUpdates(documentModel, executeSelectionOffsets);

  return true;
}
