import { getKnex } from '../lib/mysql.mjs';
import { getMysqlDatetime } from '@filbert/mysql';

/**
 * adds to document's revision history
 */
export async function postContentNodeHistory(currentPost, history, trxArg) {
  const {
    meta: { currentUndoHistoryId = -1 },
    id,
  } = currentPost;
  const knex = await getKnex();
  // use current transaction or create a new one
  const transaction = trxArg
    ? trxArg.transaction.bind(trxArg)
    : knex.transaction.bind(knex);

  return transaction(async (trx) => {
    if (currentUndoHistoryId !== -1) {
      // user has used "Undo" and now starts to edit the document again
      // get current history to merge with new history if executeState is equal
      // TODO a merge needs to happen here (conditionally) to remove what seems like a "duplicate" history entry when the user starts typing in the last undo/redo node AKA, if they don't move the caret before continuing to make edits

      // clear any history "in front of" the current cursor before adding more history
      await trx('content_node_history')
        .update({ deleted: getMysqlDatetime() })
        .where({ post_id: id })
        // NOTE: deleting current history too with greater than OR EQUALS.  This assumes the current history has the same executeState as the first entry of the new history AKA, the caret
        .andWhere('content_node_history_id', '>', currentUndoHistoryId);
    }
    // get last saved history id as starting point for new history batch
    const [{ lastHistoryId = 0 } = {}] = await trx('content_node_history')
      .max('content_node_history_id', {
        as: 'lastHistoryId',
      })
      .where({ post_id: id })
      .groupBy('post_id');

    // add 1 to lastHistoryId since index will start at 0
    const nextHistoryId = lastHistoryId + 1;

    const insertValues = history
      // TODO: verify/filter "empty", "noop" & "orphaned nodes" state updates
      .map((historyEntry, idx) => ({
        post_id: id,
        content_node_history_id: nextHistoryId + idx,
        meta: JSON.stringify({
          ...historyEntry,
        }),
      }));

    return trx('content_node_history').insert(insertValues);
  });
}

async function undoRedoHelper({ currentPost, isUndo = true }) {
  const { meta: postMeta, id } = currentPost;
  const { currentUndoHistoryId = -1, lastActionWasUndo } = postMeta;
  const knex = await getKnex();

  return knex.transaction(async (trx) => {
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
    const [history] = await trx('content_node_history')
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

    // get state updates and caret positioning to send to the frontend to update the document in memory
    const {
      meta: {
        execute: {
          historyState: executeHistoryState,
          selectionOffsets: executeSelectionOffsets,
        },
        unexecute: {
          historyState: unexecuteHistoryState,
          selectionOffsets: unexecuteSelectionOffsets,
        },
      },
    } = history;

    // update undo history cursor in post meta
    await trx('post')
      .update({
        meta: JSON.stringify({
          ...postMeta,
          currentUndoHistoryId: history.content_node_history_id,
          lastActionWasUndo: isUndo,
        }),
      })
      .where({ id });

    // read back updated post
    const [updatedPost] = await trx('post').where({ id });

    return {
      selectionOffsets: isUndo
        ? unexecuteSelectionOffsets
        : executeSelectionOffsets,
      nodeUpdatesById: isUndo ? unexecuteHistoryState : executeHistoryState,
      updatedPost,
    };
  });
}

export async function undo(req, res, next) {
  try {
    const { currentPost } = req;
    res.send(await undoRedoHelper({ currentPost }));
  } catch (err) {
    next(err);
  }
}
export async function redo(req, res, next) {
  try {
    const { currentPost } = req;
    res.send(await undoRedoHelper({ currentPost, isUndo: false }));
  } catch (err) {
    next(err);
  }
}
