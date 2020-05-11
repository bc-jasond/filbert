const { getKnex } = require("../lib/mysql");
const {
  bulkContentNodeDelete,
  bulkContentNodeUpsert,
} = require("../lib/mysql");

function pruneOrphanedNodesFromUpdates(updates) {}
/**
 * takes a list of 1 or more content nodes to update or delete for a post during edit
 */
async function postContentNodes(req, res) {
  try {
    // TODO: put in transaction
    // validate post
    const {
      body: { postId, nodeUpdatesByNodeId },
    } = req;
    const knex = await getKnex();
    const [post] = await knex("post").where({
      id: postId,
      user_id: req.loggedInUser.id,
    });
    if (!post) {
      res.status(404).send({});
      return;
    }
    // validate history: first history id in request is next id, ids are monotonic, ids are sequential
    // TODO

    // update current document state snapshot - create a map of updates and deletes
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
    res.send({ updateResult, deleteResult });
  } catch (err) {
    console.error("POST /content Error: ", err);
    res.status(500).send({});
  }
}

module.exports = {
  postContentNodes,
};
