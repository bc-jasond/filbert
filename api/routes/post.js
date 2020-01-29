const { getKnex, getNodesFlat } = require("../lib/mysql");

async function getPosts(req, res) {
  const {
    loggedInUser,
    query: { username, oldest, random }
  } = req;
  const knex = await getKnex();
  let builder = knex("post")
    .select(
      "post.id",
      "user_id",
      "canonical",
      "title",
      "abstract",
      "post.created",
      "updated",
      "published",
      "post.deleted",
      { pictureUrl: "post.picture_url" },
      "post.meta",
      "username"
    )
    .innerJoin("user", "post.user_id", "user.id")
    .whereNotNull("published")
    .limit(250);

  if (username) {
    builder = builder.andWhere("username", "like", `%${username}%`);
  }

  if (typeof random === "string") {
    /* TODO: implement
     1) select all published post ids in the the DB
     2) use Fisher Yates to fill up 100 random ids (swap from whole list, break at 100) for a WHERE IN clause
     3) add whereIn() to the builder
     */
  }

  builder = builder.orderBy(
    "published",
    typeof oldest === "string" ? "asc" : "desc"
  );

  const posts = await builder;

  if (!loggedInUser) {
    res.send(posts);
    return;
  }

  res.send(
    posts.map(post => {
      post.canEdit = loggedInUser.id === post.user_id;
      post.canDelete = loggedInUser.id === post.user_id;
      post.canPublish = loggedInUser.id === post.user_id;
      return post;
    })
  );
}

async function getPostByCanonical(req, res) {
  const { loggedInUser } = req;
  const { canonical } = req.params;
  const knex = await getKnex();
  const [post] = await knex("post").where({ canonical });
  if (!post) {
    res.status(404).send({});
    return;
  }
  const contentNodes = await getNodesFlat(knex, post.id);
  if (loggedInUser) {
    post.canEdit = loggedInUser.id === post.user_id;
    post.canDelete = loggedInUser.id === post.user_id;
    post.canPublish = loggedInUser.id === post.user_id;
  }
  res.send({ post, contentNodes });
}

/**
 * save post fields - like title, canonical & abstract
 */
async function patchPost(req, res, next) {
  try {
    const { id } = req.params;
    const { title, canonical, abstract, photoUrl, meta } = req.body;
    const knex = await getKnex();
    const [post] = await knex("post").where({
      user_id: req.loggedInUser.id,
      id
    });
    if (!post) {
      res.status(404).send({});
      return;
    }
    const patchValues = {};
    if (typeof title !== "undefined") {
      patchValues.title = title;
    }
    if (typeof canonical !== "undefined") {
      patchValues.canonical = canonical;
    }
    if (typeof abstract !== "undefined") {
      patchValues.abstract = abstract;
    }
    if (typeof photoUrl !== "undefined") {
      patchValues.photo_url = photoUrl;
    }
    if (typeof meta !== "undefined") {
      patchValues.meta = JSON.stringify(meta);
    }
    const result = await knex("post")
      .update(patchValues)
      .where({
        user_id: req.loggedInUser.id,
        id
      });
    res.send({});
  } catch (err) {
    next(err);
  }
}

/**
 * delete a PUBLISHED post
 */
async function deletePublishedPost(req, res) {
  const { id } = req.params;
  const knex = await getKnex();
  const [post] = await knex("post")
    .whereNotNull("published")
    .andWhere({
      user_id: req.loggedInUser.id,
      id
    });
  if (!post) {
    res.status(404).send({});
    return;
  }
  /**
   * DANGER ZONE!!!
   */
  await knex("content_node")
    .where("post_id", post.id)
    .del();
  await knex("post")
    .where("id", post.id)
    .del();
  res.status(204).send({});
}

module.exports = {
  getPosts,
  getPostByCanonical,
  patchPost,
  deletePublishedPost
};
