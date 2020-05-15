const { getKnex } = require("../lib/mysql");
const {
  bulkContentNodeDelete,
  bulkContentNodeUpsert,
} = require("../lib/mysql");
const { postContentNodeHistory } = require("./content-node-history");

function pruneOrphanedNodesFromUpdates(updates) {}
/**
 * takes a list of 1 or more content nodes to update or delete for a post during edit
 */
async function postContentNodes(req, res) {
  try {
    // validate post
    const {
      body: { nodeUpdatesByNodeId, contentNodeHistory },
      currentPost,
    } = req;
    const { id: postId, meta: postMeta } = currentPost;
    const { currentUndoHistoryId } = postMeta;

    // TODO: put in transaction
    // 1) save history
    const contentNodeHistoryResult = await postContentNodeHistory(
      currentPost,
      contentNodeHistory
    );

    // 2) reset post undo history cursor to -1 if in "undo" state
    let updatedPost;
    if (currentUndoHistoryId !== -1) {
      const knex = await getKnex();
      await knex("post")
        .update({
          meta: JSON.stringify({
            ...postMeta,
            currentUndoHistoryId: -1,
            lastActionWasUndo: false,
          }),
        })
        .where({ id: postId });

      // read back updated post
      [updatedPost] = await knex("post").where({ id: postId });
    }

    // 3) update current document state snapshot - create a map of updates and deletes
    let updates = [];
    let deletes = [];
    nodeUpdatesByNodeId
      // dedupe - last wins
      .filter((nodeUpdate, idx, thisList) => {
        const currentNodeId =
          typeof nodeUpdate === "string" ? nodeUpdate : nodeUpdate.id;
        const lastUpdateIndex = [...thisList]
          .reverse()
          .findIndex((innerNodeUpdate) => {
            const innerNodeId =
              typeof innerNodeUpdate === "string"
                ? innerNodeUpdate
                : innerNodeUpdate.id;
            return innerNodeId === currentNodeId;
          });
        return idx === thisList.length - 1 - lastUpdateIndex;
      })
      .forEach((nodeUpdate) => {
        const isDelete = typeof nodeUpdate === "string";
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
    res.send({
      updateResult,
      deleteResult,
      contentNodeHistoryResult,
      updatedPost,
    });
  } catch (err) {
    console.error("POST /content Error: ", err);
    res.status(500).send({});
  }
}

module.exports = {
  postContentNodes,
};
