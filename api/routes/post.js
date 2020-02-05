const { getKnex, getNodesFlat } = require("../lib/mysql");
const {
  getFirstPhotoAndAbstractFromContent,
  addFirstPhotoTitleAndAbstractToPosts
} = require("../lib/post-util");

async function getPosts(req, res) {
  const {
    loggedInUser,
    query: { username, oldest, random }
  } = req;
  const knex = await getKnex();
  let builder = knex("post")
    .select(
      "post.id",
      { userId: "user.id" },
      { userProfileIsPublic: "user.is_public" },
      "canonical",
      "title",
      "abstract",
      "post.created",
      "updated",
      "published",
      "post.deleted",
      "post.meta",
      "username",
      { profilePictureUrl: "user.picture_url" },
      { familyName: "family_name" },
      { givenName: "given_name" }
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

  let posts = await builder;
  posts = await addFirstPhotoTitleAndAbstractToPosts(posts);

  if (!loggedInUser) {
    res.send(posts);
    return;
  }

  res.send(
    // TODO: add to query above instead of looping here
    posts.map(post => {
      // keep users info private if they don't want to share it!
      if (!post.userProfileIsPublic && loggedInUser.id !== post.userId) {
        delete post.userId;
        delete post.profilePictureUrl;
        delete post.familyName;
        delete post.givenName;
      }
      post.canEdit = loggedInUser.id === post.userId;
      post.canDelete = loggedInUser.id === post.userId;
      post.canPublish = loggedInUser.id === post.userId;
      return post;
    })
  );
}

// returns both post and content
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
  delete post.user_id;
  res.send({ post, contentNodes });
}

// returns only post
async function getPostById(req, res) {
  const { id } = req.params;
  const knex = await getKnex();
  const [post] = await knex("post").where({
    user_id: req.loggedInUser.id,
    id
  });
  if (!post) {
    res.status(404).send({});
    return;
  }
  delete post.user_id;
  res.send({ post });
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

async function getSummaryAndPhotoFromContent(req, res) {
  const { id } = req.params;
  const knex = await getKnex();
  const [post] = await knex("post").where({
    user_id: req.loggedInUser.id,
    id
  });
  if (!post) {
    res.status(404).send({});
    return;
  }
  const responseData = {};
  const contentNodes = await getNodesFlat(knex, id);

  if (!contentNodes) {
    res.send(responseData);
  }
  res.send(getFirstPhotoAndAbstractFromContent(contentNodes));
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
  getPostById,
  patchPost,
  deletePublishedPost,
  getSummaryAndPhotoFromContent
};
