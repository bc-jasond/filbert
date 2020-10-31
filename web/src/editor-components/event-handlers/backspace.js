import {Map} from 'immutable'
import { KEYCODE_BACKSPACE } from '../../common/constants';
import { stopAndPrevent } from '../../common/utils';
import { doDelete, doDeleteMetaType, doMerge } from '../editor-commands/delete';

export async function handleBackspace({
  evt,
  selectionOffsets,
  documentModel,
  historyManager,
  commitUpdates,
    setEditSectionNode,
}) {
  // if the caret is collapsed, only let the "backspace" key through...
  // otherwise, if there are any other key strokes that aren't control keys - delete the selection!
  if (
    evt.keyCode !== KEYCODE_BACKSPACE &&
    evt.inputType !== 'deleteContentBackward'
  ) {
    return false;
  }

  stopAndPrevent(evt);

  const { startNodeId, endNodeId, caretStart, caretEnd } = selectionOffsets;

  const historyState = [];
  let executeSelectionOffsets = selectionOffsets;

  // is this a MetaType node?
  if (documentModel.isMetaType(startNodeId)) {
    const {
      historyState: historyStateDeleteMetaType,
      executeSelectionOffsets: executeSelectionOffsetsDeleteMetaType,
    } = doDeleteMetaType(documentModel, selectionOffsets);
    historyState.push(...historyStateDeleteMetaType);
    executeSelectionOffsets = executeSelectionOffsetsDeleteMetaType;

    historyManager.appendToHistoryLog({
      executeSelectionOffsets,
      unexecuteSelectionOffsets: selectionOffsets,
      historyState,
    });
    await commitUpdates(executeSelectionOffsets);
    setEditSectionNode(Map())
    return true;
  }

  const hasContentToDelete = endNodeId || caretStart > 0 || caretEnd;

  // is there any content to delete?
  if (hasContentToDelete) {
    const {
      historyState: historyStateDelete,
      executeSelectionOffsets: executeSelectionOffsetsDelete,
    } = doDelete(documentModel, selectionOffsets);
    historyState.push(...historyStateDelete);
    executeSelectionOffsets = executeSelectionOffsetsDelete;
  }

  // if doDelete() returns a different startNodeId, a merge is required
  // TODO: verify highlight + cut or delete has the right behavior
  const needsMergeWithOtherNode =
    executeSelectionOffsets.startNodeId !== startNodeId ||
    (!caretStart && !caretEnd);

  if (needsMergeWithOtherNode) {
    const {
      executeSelectionOffsets: executeSelectionOffsetsMerge,
      historyState: historyStateMerge,
    } = doMerge(documentModel, executeSelectionOffsets);
    historyState.push(...historyStateMerge);
    executeSelectionOffsets = executeSelectionOffsetsMerge;
  }

  // since this handler catches keystrokes *before* DOM updates, deleting one char will look like a diff length of 0
  const didDeleteContentInOneNode = !endNodeId && hasContentToDelete;

  if (didDeleteContentInOneNode) {
    historyManager.appendToHistoryLogWhenNCharsAreDifferent({
      executeSelectionOffsets,
      unexecuteSelectionOffsets: selectionOffsets,
      historyState,
      comparisonPath: ['content'],
    });
  } else {
    historyManager.appendToHistoryLog({
      executeSelectionOffsets,
      unexecuteSelectionOffsets: selectionOffsets,
      historyState,
    });
  }

  // clear the selected format node when deleting the highlighted selection
  // NOTE: must wait for state to have been set or setCaret will check stale values
  await commitUpdates(executeSelectionOffsets);
  return true;
}
