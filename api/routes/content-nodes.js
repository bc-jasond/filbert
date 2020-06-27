const { getKnex } = require('../lib/mysql');
const {
  postContentNodeHistory,
  updateDocumentSnapshot,
} = require('./content-node-history');

function pruneOrphanedNodesFromUpdates(updates) {}

/**
 * takes a list of 1 or more content nodes to update or delete for a post during edit
 */
async function postContentNodes(req, res) {
  try {
    // validate post
    const {
      body: { nodeUpdatesByNodeId, contentNodeHistoryLog },
      currentPost,
    } = req;
    const { id: postId, meta: postMeta } = currentPost;
    const { currentUndoHistoryId } = postMeta;

    // TODO: put in transaction
    // 1) save history
    let contentNodeHistoryLogResult;
    if (contentNodeHistoryLog) {
      contentNodeHistoryLogResult = await postContentNodeHistory(
        currentPost,
        contentNodeHistoryLog
      );
    }

    // 2) reset post undo history cursor to -1 if in "undo" state
    let updatedPost;
    if (currentUndoHistoryId !== -1) {
      const knex = await getKnex();
      await knex('post')
        .update({
          meta: JSON.stringify({
            ...postMeta,
            currentUndoHistoryId: -1,
            lastActionWasUndo: false,
          }),
        })
        .where({ id: postId });

      // read back updated post
      [updatedPost] = await knex('post').where({ id: postId });
    }

    // 3) update current document state snapshot - create a map of updates and deletes
    const { updateResult, deleteResult } = await updateDocumentSnapshot(
      postId,
      nodeUpdatesByNodeId
    );

    res.send({
      updateResult,
      deleteResult,
      contentNodeHistoryLogResult,
      updatedPost,
    });
  } catch (err) {
    console.error('POST /content Error: ', err);
    res.status(500).send({});
  }
}

module.exports = {
  postContentNodes,
  updateDocumentSnapshot,
};
