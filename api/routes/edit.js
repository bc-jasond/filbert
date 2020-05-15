const { getKnex, getNodesFlat } = require("../lib/mysql");
/**
 * get post for editing - signed-in user only
 */
async function getPostForEdit(req, res) {
  const { currentPost } = req;
  const {
    meta: { currentUndoHistoryId, lastActionWasUndo },
    id,
  } = currentPost;
  const contentNodes = await getNodesFlat(id);
  // get history for caret positioning on document load
  const knex = await getKnex();
  // if not in an undo/redo state, get most recent history
  const whereClause = { post_id: id };
  // undo/redo state - get history at currentUndoHistoryId
  if (currentUndoHistoryId && currentUndoHistoryId !== -1) {
    whereClause.content_node_history_id = currentUndoHistoryId;
  }
  const [
    { meta: { executeOffsets = {}, unexecuteOffsets } = {} } = {},
  ] = await knex("content_node_history")
    .where(whereClause)
    .orderBy("content_node_history_id", "desc")
    .limit(1);

  res.send({
    post: currentPost,
    contentNodes,
    selectionOffsets:
      currentUndoHistoryId !== -1 && lastActionWasUndo
        ? unexecuteOffsets
        : executeOffsets,
  });
}

module.exports = {
  getPostForEdit,
};
