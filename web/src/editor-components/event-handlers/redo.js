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

  const redoResult = await historyManager.redo(false);
  // already at end of history?
  const nodesById = redoResult.get('nodesById', Map());
  const historyOffsets = redoResult.get('selectionOffsets', Map());
  const updatedPost = redoResult.get('updatedPost', Map());
  if (nodesById.size === 0) {
    return true;
  }

  console.info('REDO!', redoResult.toJS());
  documentModel.setNodes(nodesById);
  // Right now, nothing depends on changes to the "post" object but, seems like bad form to
  // not update it given the meta data will have changed (currentUndoHistoryId)
  currentPost.set(updatedPost);
  if (editSectionNode) {
    // update this or undo/redo changes won't be reflected in the open menus while editing meta sections!
    setEditSectionNode(documentModel.getNode(editSectionNode.get('id')));
  }

  await commitUpdates(historyOffsets.toJS());
  return true;
}
