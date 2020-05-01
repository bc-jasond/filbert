const { getKnex } = require("../lib/mysql");
const {
  bulkContentNodeDelete,
  bulkContentNodeUpsert,
} = require("../lib/mysql");
/**
 * takes a list of 1 or more content nodes to update or delete for a post during edit
 */
async function postContentNodes(req, res) {
  try {
    // TODO: put in transaction
    // validate post
    const {
      body: { postId, historyLogEntries },
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

    // create a map of updates and deletes
    let updates = [];
    let deletes = [];
    historyLogEntries.forEach(({ historyState }) => {
      historyState.forEach(({ executeState: currentNode }) => {
        // always remove node from updates or deletes first - last wins
        updates = updates.filter(([nodeId]) => nodeId !== currentNode.id);
        deletes = deletes.filter(([nodeId]) => nodeId !== currentNode.id);
        // if executeState is undefined - it's a delete
        (!currentNode ? deletes : updates).push([
          currentNode.id,
          { post_id: postId, node: currentNode },
        ]);
      });
    });

    // TODO: validate updates, trim invalid selections, orphaned nodes, etc.
    const updateResult = await bulkContentNodeUpsert(updates);
    const deleteResult = await bulkContentNodeDelete(deletes);
    res.send({ updateResult, deleteResult });
  } catch (err) {
    console.error("POST /content Error: ", err);
    res.status(500).send({});
  }
}

module.exports = {
  postContentNodes,
};
