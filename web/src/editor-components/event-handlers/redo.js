import { getNode, getId } from '@filbert/linked-list';
import { KEYCODE_Z } from '@filbert/constants';

import { stopAndPrevent } from '../../common/utils';
import { currentPost } from '../../stores';

export function isRedoEvent(evt) {
  return (
    evt.keyCode === KEYCODE_Z && evt.shiftKey && (evt.metaKey || evt.ctrlKey)
  );
}

export async function handleRedo({
  evt,
  historyManager,
  commitUpdates,
  editSectionNode,
  setEditSectionNode,
}) {
  if (!isRedoEvent(evt)) {
    return false;
  }

  stopAndPrevent(evt);

  const {
    updatedPost,
    documentModel: documentModelRedo,
    selectionOffsets,
  } = await historyManager.redo();
  // already at end of history?
  if (!documentModelRedo) {
    return true;
  }

  console.info('REDO!', { updatedPost, documentModelRedo, selectionOffsets });

  // Right now, nothing depends on changes to the "post" object but, seems like bad form to
  // not update it given the meta data will have changed (currentUndoHistoryId)
  currentPost.set(updatedPost);
  if (getId(editSectionNode)) {
    // update this or undo/redo changes won't be reflected in the open menus while editing meta sections!
    setEditSectionNode(getNode(documentModelRedo, editSectionNode));
  }

  await commitUpdates(documentModelRedo, selectionOffsets);
  return true;
}
