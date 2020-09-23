import { KEYCODE_ENTER } from '../../common/constants';
import { stopAndPrevent } from '../../common/utils';
import { doSplit } from '../editor-commands/split';

export async function handleEnter({
  evt,
  selectionOffsets,
  documentModel,
  historyManager,
  commitUpdates,
}) {
  if (evt.keyCode !== KEYCODE_ENTER) {
    return;
  }

  stopAndPrevent(evt);

  // perform editor commands
  const { executeSelectionOffsets, historyState } = doSplit(
    documentModel,
    selectionOffsets
  );
  // create history log entry
  historyManager.appendToHistoryLog({
    executeSelectionOffsets,
    unexecuteSelectionOffsets: selectionOffsets,
    historyState,
  });

  await commitUpdates(executeSelectionOffsets);
}
