const { getKnex } = require("../lib/mysql");
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
    // clear any history "in front of" the current cursor before adding more history
    await knex("content_node_history")
      .where({ post_id: id })
      .andWhere("content_node_history_id", ">", currentUndoHistoryId)
      .del();
  }
  // get last saved history id as starting point for new history batch
  const [{ lastHistoryId = 0 } = {}] = await knex("content_node_history")
    .max("content_node_history_id", {
      as: "lastHistoryId",
    })
    .where({ post_id: id })
    .groupBy("post_id");

  // add 1 to lastHistoryId since index will start at 0
  const nextHistoryId = lastHistoryId + 1;

  const insertValues = history.map(
    ({ executeOffsets, unexecuteOffsets, historyState }, idx) => ({
      post_id: id,
      content_node_history_id: nextHistoryId + idx,
      meta: JSON.stringify({ executeOffsets, unexecuteOffsets, historyState }),
    })
  );

  return knex("content_node_history").insert(insertValues);
}

async function undoRedoHelper({ currentPost, isUndo = true }) {
  const { meta: postMeta, id } = currentPost;
  const { currentUndoHistoryId = -1, lastActionWasUndo } = postMeta;
  const knex = await getKnex();

  // TODO: transaction!

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
    comparisonOperand = lastActionWasUndo ? "<" : "<=";
  } else {
    // REDO: if the last action was 'redo' we need to move to the next history but, if it
    // was 'undo' we stay and apply the current "executeState" before moving
    comparisonOperand = lastActionWasUndo ? ">=" : ">";
  }
  const [history] = await knex("content_node_history")
    .where({ post_id: id })
    .andWhere(
      "content_node_history_id",
      comparisonOperand,
      currentUndoHistoryIdExpanded
    )
    .orderBy("content_node_history_id", isUndo ? "desc" : "asc")
    .limit(1);

  if (!history) {
    // UNDO: went past first history, return
    // REDO: went past last history, TODO: return or set currentUndoHistoryId back to -1 first?
    return {};
  }

  // update undo history cursor in post meta
  await knex("post")
    .update({
      meta: JSON.stringify({
        ...postMeta,
        currentUndoHistoryId: history.content_node_history_id,
        lastActionWasUndo: isUndo,
      }),
    })
    .where({ id });

  // read back updated post
  const [updatedPost] = await knex("post").where({ id });

  return { history, updatedPost };
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
  postContentNodeHistory,
  undo,
  redo,
};
