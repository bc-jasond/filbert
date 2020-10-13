import { Map } from 'immutable';
import { KEYCODE_Z } from '../../common/constants';
import { stopAndPrevent } from '../../common/utils';

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
  setPost,
}) {
  if (!isRedoEvent(evt)) {
    return false;
  }

  stopAndPrevent(evt);

  const redoResult = await historyManager.redo(documentModel.getNodes(), false);
  // already at end of history?
  const updatedNodesById = redoResult.get('nodesById', Map());
  const historyOffsets = redoResult.get('selectionOffsets', Map());
  const updatedPost = redoResult.get('updatedPost', Map());
  if (updatedNodesById.size === 0) {
    return true;
  }

  console.info('REDO!', redoResult.toJS());
  documentModel.setNodes(updatedNodesById);
  // Right now, nothing depends on changes to the "post" object but, seems like bad form to
  // not update it given the meta data will have changed (currentUndoHistoryId)
  setPost(updatedPost);
  if (editSectionNode) {
    // update this or undo/redo changes won't be reflected in the open menus while editing meta sections!
    setEditSectionNode(documentModel.getNode(editSectionNode.get('id')));
  }

  await commitUpdates(historyOffsets.toJS());
  return true;
}
