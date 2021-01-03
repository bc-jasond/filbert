import { Map } from 'immutable';
import { KEYCODE_BACKSPACE } from '@filbert/constants';
import { stopAndPrevent } from '../../common/utils';
import {
  doDeleteSingleNodeBackspace,
  doDeleteMultiNodeBackspace,
} from '../../editor-components/editor-commands/delete';

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
    evt.inputType !== 'deleteContentBackward' &&
    evt.inputType !== 'deleteByCut'
  ) {
    return false;
  }

  stopAndPrevent(evt);

  const { endNodeId } = selectionOffsets;

  // SINGLE NODE
  if (!endNodeId) {
    const {
      selectionOffsets: executeSelectionOffsets,
    } = doDeleteSingleNodeBackspace(
      documentModel,
      historyManager,
      selectionOffsets
    );
    setEditSectionNode(Map());
    await commitUpdates(executeSelectionOffsets);
    return true;
  }

  // MULTI-NODE
  const {
    selectionOffsets: executeSelectionOffsets,
  } = doDeleteMultiNodeBackspace(
    documentModel,
    historyManager,
    selectionOffsets
  );
  // clear the selected format node when deleting the highlighted selection
  // NOTE: must wait for state to have been set or setCaret will check stale values
  await commitUpdates(executeSelectionOffsets);
  return true;
}
