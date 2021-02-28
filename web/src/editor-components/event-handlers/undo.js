import { Map } from 'immutable';
import { KEYCODE_Z } from '@filbert/constants';
import { stopAndPrevent } from '../../common/utils';
import { currentPost } from '../../stores';
import { DocumentModel } from '../../../../lib/document/document-model.mjs';

export function isUndoEvent(evt) {
  return evt.keyCode === KEYCODE_Z && (evt.metaKey || evt.ctrlKey);
}

/**
 * moves the undo cursor position
 * applies the unexecute state to the document
 * IF user makes edits after an undo - all history entries after this current one need to be marked deleted before adding another one
 * @returns {Promise<void>}
 */
export async function handleUndo({
  evt,
  documentModel,
  historyManager,
  commitUpdates,
  editSectionNode,
  setEditSectionNode,
}) {
  if (!isUndoEvent(evt)) {
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

  console.info('UNDO!', { updatedPost, head, nodesById, selectionOffsets });

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
