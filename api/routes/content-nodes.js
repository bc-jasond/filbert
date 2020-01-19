const {
  bulkContentNodeDelete,
  bulkContentNodeUpsert
} = require("../lib/mysql");
/**
 * takes a list of 1 or more content nodes to update and/or delete for a post during edit
 */
async function postContentNodes(req, res) {
  try {
    const updates = req.body.filter(change => change[1].action === "update");
    const deletes = req.body.filter(change => change[1].action === "delete");
    // TODO: put in transaction
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
  postContentNodes
};
