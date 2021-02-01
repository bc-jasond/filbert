import immutable from 'immutable';
import { getKnex, getNodesFlat } from '../lib/mysql.mjs';

const {fromJS, Map} = immutable;

async function historyDiff(postId, leftHistoryId, rightHistoryId, trxArg) {
  const knex = await getKnex();
  // use current transaction or create a new one
  const transaction = trxArg
      ? trxArg.transaction.bind(trxArg)
      : knex.transaction.bind(knex);

  return transaction(async (trx) => {
    const {contentNodes: contentNodesLeft, selectionOffsets} = await getNodesFlat(postId, leftHistoryId, trx)
    const nodesLeft = fromJS(contentNodesLeft);
    const {contentNodes: contentNodesRight} = await getNodesFlat(postId, rightHistoryId, trx);
    const nodesRight = fromJS(contentNodesRight);

    let diff = Map();
    // visit each node from the earlier (left) document snapshot
    // if it's not present or different in the later (right) document snapshot, add the whole node to diff state
    nodesLeft.forEach((left, leftNodeId) => {
      const right = nodesRight.get(leftNodeId, Map());
      if (!right.size || !right.equals(left)) {
        diff = diff.set(leftNodeId, left);
      }
    })
    // visit each node from the later (right) document snapshot
    // if it's not in the earlier (left), mark it deleted by adding the nodeId as a string
    nodesRight.forEach((right, rightNodeId) => {
      const left = nodesLeft.get(rightNodeId, Map());
      if (!left.size) {
        diff = diff.set(rightNodeId, rightNodeId);
      }
    })
    return {historyState: diff.toJS(), selectionOffsets};
  })
}

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
    // get last saved history id as starting point for new history batch
    const [{ lastHistoryId = 0 } = {}] = await trx('content_node_history')
        .max('content_node_history_id', {
          as: 'lastHistoryId',
        })
        .where({ post_id: id })
        .groupBy('post_id');

    if (currentUndoHistoryId > -1 && currentUndoHistoryId < lastHistoryId) {
      // user has used "Undo" and now starts to edit the document again
      // create a diff of the document state between the current history cursor and the last history
      // add this "undo" history to the front of the new history - this effectively "resets" the document state before
      // applying the new changes
      const diffHistoryEntry = await historyDiff(id, currentUndoHistoryId, lastHistoryId, trx)
      console.info("adding UNDO history", diffHistoryEntry)
      history.unshift(diffHistoryEntry)
    }

    // add 1 to lastHistoryId since index will start at 0
    const nextHistoryId = lastHistoryId + 1;

    const insertValues = history
      // TODO: verify/filter "empty", "noop" & "orphaned nodes" state updates
      .map((historyEntry, idx) => ({
        post_id: id,
        content_node_history_id: nextHistoryId + idx,
        meta: JSON.stringify(historyEntry),
      }));

    return trx('content_node_history').insert(insertValues);
  });
}

export async function postHistoryLogEntries(req, res) {
  try {
    // validate post
    const {
      body: { contentNodeHistoryLog },
      currentPost,
    } = req;
    const { id: postId, meta: postMeta } = currentPost;
    const { currentUndoHistoryId } = postMeta;
    const knex = await getKnex();

    await knex.transaction(async (trx) => {
      // 1) save history
      const contentNodeHistoryLogResult = await postContentNodeHistory(
        currentPost,
        contentNodeHistoryLog,
        trx
      );

      // 2) reset post undo history cursor to -1 if in "undo" state
      let updatedPost;
      if (currentUndoHistoryId !== -1) {
        await trx('post')
          .update({
            meta: JSON.stringify({
              ...postMeta,
              currentUndoHistoryId: -1,
            }),
          })
          .where({ id: postId });

        // read back updated post
        [updatedPost] = await trx('post').where({ id: postId });
      }

      res.send({
        contentNodeHistoryLogResult,
        updatedPost,
      });
    });
  } catch (err) {
    console.error('POST /content Error: ', err);
    res.status(500).send({});
  }
}

async function undoRedoHelper({ currentPost, isUndo = true }) {
  const { meta: postMeta, id } = currentPost;
  const { currentUndoHistoryId = -1 } = postMeta;
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

    const comparisonOperand = isUndo ? '<' : '>';
    const historyList = await trx('content_node_history')
      .where({ post_id: id, deleted: null })
      .andWhere(
        'content_node_history_id',
        comparisonOperand,
        currentUndoHistoryIdExpanded
      )
      .orderBy('content_node_history_id', isUndo ? 'desc' : 'asc')
      .limit(2);

    let [history] = historyList;
    if (isUndo && currentUndoHistoryId === -1) {
      // we're already on the "last history" - get second to last history
      [,history] = historyList;
    }

    if (!history) {
      // UNDO: went past first history, return
      // REDO: went past last history, TODO: return or set currentUndoHistoryId back to -1 first?
      return {};
    }

    // update undo history cursor in post meta
    await trx('post')
      .update({
        meta: JSON.stringify({
          ...postMeta,
          currentUndoHistoryId: history.content_node_history_id,
        }),
      })
      .where({ id });

    // update post data - we're in a transaction, no need to do a read-back from DB
    currentPost.meta.currentUndoHistoryId = history.content_node_history_id;

    // get all nodes for this point in history to send to the frontend - nice 'n dumb
    const { contentNodes, selectionOffsets } = await getNodesFlat(
      id,
      history.content_node_history_id,
      trx
    );

    return {
      selectionOffsets,
      nodesById: contentNodes,
      updatedPost: currentPost,
    };
  });
}

export async function undo(req, res, next) {
  try {
    const {
      currentPost,
    } = req;
    res.send(await undoRedoHelper({ currentPost }));
  } catch (err) {
    next(err);
  }
}
export async function redo(req, res, next) {
  try {
    const {
      currentPost,
    } = req;
    res.send(await undoRedoHelper({ currentPost, isUndo: false }));
  } catch (err) {
    next(err);
  }
}


