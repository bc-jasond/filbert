import { getMysqlDatetime } from '../lib/mysql';

const {
  getKnex,
  bulkContentNodeUpsert,
  bulkContentNodeDelete,
} = require('../lib/mysql');

async function updateDocumentSnapshot(postId, nodeUpdatesByNodeId = []) {
  let updates = [];
  let deletes = [];
  nodeUpdatesByNodeId
    // dedupe - last wins
    .filter((nodeUpdate, idx, thisList) => {
      const currentNodeId =
        typeof nodeUpdate === 'string' ? nodeUpdate : nodeUpdate.id;
      const lastUpdateIndex = [...thisList]
        .reverse()
        .findIndex((innerNodeUpdate) => {
          const innerNodeId =
            typeof innerNodeUpdate === 'string'
              ? innerNodeUpdate
              : innerNodeUpdate.id;
          return innerNodeId === currentNodeId;
        });
      return idx === thisList.length - 1 - lastUpdateIndex;
    })
    .forEach((nodeUpdate) => {
      const isDelete = typeof nodeUpdate === 'string';
      const currentNodeId = isDelete ? nodeUpdate : nodeUpdate.id;

      if (isDelete) {
        deletes.push(currentNodeId);
        return;
      }
      updates.push(nodeUpdate);
    });

  // TODO: validation
  //  - node fields are correct
  //  - delete all selections if any are invalid
  //  - orphaned nodes
  //    - now: delete them, log it
  //    - eventually: append to end of document for now <- this requires adding a history entry.
  const updateResult = await bulkContentNodeUpsert(postId, updates);
  const deleteResult = await bulkContentNodeDelete(postId, deletes);
  return { updateResult, deleteResult };
}
/**
 * adds to document's revision history
 */
async function postContentNodeHistory(currentPost, history) {
  // TODO: put in transaction
  const {
    meta: { currentUndoHistoryId = -1 },
    id,
  } = currentPost;
  const knex = await getKnex();

  if (currentUndoHistoryId !== -1) {
    // user has used "Undo" and now starts to edit the document again
    // get current history to merge with new history if executeState is equal
    // TODO a merge needs to happen here (conditionally) to remove what seems like a "duplicate" history entry when the user starts typing in the last undo/redo node AKA, if they don't move the caret before continuing to make edits

    // clear any history "in front of" the current cursor before adding more history
    await knex('content_node_history')
      .update({ deleted: getMysqlDatetime() })
      .where({ post_id: id })
      // NOTE: deleting current history too with greater than OR EQUALS.  This assumes the current history has the same executeState as the first entry of the new history AKA, the caret
      .andWhere('content_node_history_id', '>', currentUndoHistoryId);
  }
  // get last saved history id as starting point for new history batch
  const [{ lastHistoryId = 0 } = {}] = await knex('content_node_history')
    .max('content_node_history_id', {
      as: 'lastHistoryId',
    })
    .where({ post_id: id })
    .groupBy('post_id');

  // add 1 to lastHistoryId since index will start at 0
  const nextHistoryId = lastHistoryId + 1;

  const insertValues = history.map(
    ({ executeOffsets, unexecuteOffsets, historyState }, idx) => ({
      post_id: id,
      content_node_history_id: nextHistoryId + idx,
      meta: JSON.stringify({ executeOffsets, unexecuteOffsets, historyState }),
    })
  );

  return knex('content_node_history').insert(insertValues);
}

async function undoRedoHelper({ currentPost, isUndo = true }) {
  const { meta: postMeta, id } = currentPost;
  const { currentUndoHistoryId = -1, lastActionWasUndo } = postMeta;
  const knex = await getKnex();

  // TODO: transaction around this whole thing!

  const isRedo = !isUndo;

  if (isRedo && currentUndoHistoryId === -1) {
    return {};
  }
  // UNDO: if current is -1, it's the first history action, set to MAX in order to return the most recent history
  // REDO: will always be > -1
  const currentUndoHistoryIdExpanded =
    currentUndoHistoryId === -1
      ? Number.MAX_SAFE_INTEGER
      : currentUndoHistoryId;

  // if switching between undo and redo, need to be careful with off-by-1 errors.
  let comparisonOperand;
  if (isUndo) {
    // UNDO: if the last action was 'undo' we need to move to the previous history but, if it
    // was 'redo' we stay and apply the current "unexecuteState" before moving the cursor
    comparisonOperand = lastActionWasUndo ? '<' : '<=';
  } else {
    // REDO: if the last action was 'redo' we need to move to the next history but, if it
    // was 'undo' we stay and apply the current "executeState" before moving
    comparisonOperand = lastActionWasUndo ? '>=' : '>';
  }
  const [history] = await knex('content_node_history')
    .where({ post_id: id, deleted: null })
    .andWhere(
      'content_node_history_id',
      comparisonOperand,
      currentUndoHistoryIdExpanded
    )
    .orderBy('content_node_history_id', isUndo ? 'desc' : 'asc')
    .limit(1);

  if (!history) {
    // UNDO: went past first history, return
    // REDO: went past last history, TODO: return or set currentUndoHistoryId back to -1 first?
    return {};
  }

  // process history into a list of updates to update current snapshot and to send to frontend to update the document in memory
  const {
    meta: { historyState, executeOffsets, unexecuteOffsets },
  } = history;
  let statesByNodeId = historyState.map(({ executeState, unexecuteState }) =>
    isRedo
      ? // redo: if execute is falsy, it was a delete operation.  Use the unexecute id to delete
        executeState || unexecuteState.id
      : // undo: if unexecute is falsy it was an insert - mark node for delete by returning just the id
        unexecuteState || executeState.id
  );
  if (isUndo) {
    // play updates in reverse for undo!
    statesByNodeId.reverse();
  }
  // update document snapshot
  await updateDocumentSnapshot(id, statesByNodeId);

  // update undo history cursor in post meta
  await knex('post')
    .update({
      meta: JSON.stringify({
        ...postMeta,
        currentUndoHistoryId: history.content_node_history_id,
        lastActionWasUndo: isUndo,
      }),
    })
    .where({ id });

  // read back updated post
  const [updatedPost] = await knex('post').where({ id });

  return {
    selectionOffsets: isUndo ? unexecuteOffsets : executeOffsets,
    nodeUpdatesById: statesByNodeId,
    updatedPost,
  };
}

async function undo(req, res, next) {
  try {
    const { currentPost } = req;
    res.send(await undoRedoHelper({ currentPost, isUndo: true }));
  } catch (err) {
    next(err);
  }
}
async function redo(req, res, next) {
  try {
    const { currentPost } = req;
    res.send(await undoRedoHelper({ currentPost, isUndo: false }));
  } catch (err) {
    next(err);
  }
}

module.exports = {
  updateDocumentSnapshot,
  postContentNodeHistory,
  undo,
  redo,
};
