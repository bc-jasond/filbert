const { getKnex, getNodesFlat } = require("../lib/mysql");
/**
 * get post for editing - signed-in user only
 */
async function getPostForEdit(req, res) {
  const { id } = req.params;
  const knex = await getKnex();
  const [post] = await knex("post").where({
    id,
    user_id: req.loggedInUser.id
  });
  if (!post) {
    res.status(404).send({});
    return;
  }
  const contentNodes = await getNodesFlat(knex, post.id);
  res.send({ post, contentNodes });
}

module.exports = {
  getPostForEdit
};
