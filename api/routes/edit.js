const { getNodesFlat } = require("../lib/mysql");
/**
 * get post for editing - signed-in user only
 */
async function getPostForEdit(req, res) {
  const { currentPost } = req;
  const { id } = currentPost;
  const contentNodes = await getNodesFlat(id);
  res.send({ post: currentPost, contentNodes });
}

module.exports = {
  getPostForEdit,
};
