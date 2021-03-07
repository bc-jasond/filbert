import { Map } from 'immutable';
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
  documentModel,
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
    head,
    nodesById,
    selectionOffsets,
  } = await historyManager.redo(false);
  // already at end of history?
  if (Map(nodesById).size === 0) {
    return documentModel;
  }

  console.info('REDO!', { updatedPost, head, nodesById, selectionOffsets });

  const documentModelUpdated = DocumentModel.fromJS(
    updatedPost.id,
    head,
    nodesById
  );
  // Right now, nothing depends on changes to the "post" object but, seems like bad form to
  // not update it given the meta data will have changed (currentUndoHistoryId)
  currentPost.set(updatedPost);
  if (editSectionNode.id) {
    // update this or undo/redo changes won't be reflected in the open menus while editing meta sections!
    setEditSectionNode(documentModelUpdated.getNode(editSectionNode));
  }

  await commitUpdates(selectionOffsets);
  return documentModelUpdated;
}
