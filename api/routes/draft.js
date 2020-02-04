const { getKnex, getMysqlDatetime } = require("../lib/mysql");
/**
 * creates a new draft for logged in user
 */
async function postDraft(req, res) {
  const user_id = req.loggedInUser.id;
  const { title, canonical, meta } = req.body;
  const insertValues = { user_id, title, canonical };
  insertValues.meta = JSON.stringify(
    meta || { syncTitleAndAbstract: true, syncTopPhoto: true }
  );
  const knex = await getKnex();
  const [postId] = await knex.insert(insertValues).into("post");
  res.send({ postId });
}
/**
 * list drafts for logged in user
 */
async function getDrafts(req, res, next) {
  try {
    const {
      loggedInUser,
      query: { contains, oldest, random }
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
        "username",
        { profilePictureUrl: "user.picture_url" },
        { familyName: "family_name" },
        { givenName: "given_name" },
        // the following are always true for drafts
        knex.raw(`1 as 'canEdit'`),
        knex.raw(`1 as 'canDelete'`),
        knex.raw(`1 as 'canPublish'`),
        knex.raw(`1 as 'userProfileIsPublic'`)
      )
      .innerJoin("user", "post.user_id", "user.id")
      .whereNull("published")
      .andWhere("post.user_id", loggedInUser.id)
      .limit(250);

    if (typeof contains === "string") {
      builder = builder.andWhereRaw(
        "MATCH (title,abstract) AGAINST (? IN BOOLEAN MODE)",
        [contains]
      );
    }

    if (typeof random === "string") {
      /* TODO: implement random
       1) select all published post ids in the the DB
       2) use Fisher Yates to fill up 100 random ids (swap from whole list, break at 100) for a WHERE IN clause
       3) add whereIn() to the builder
       */
    }

    builder = builder.orderBy(
      "post.created",
      typeof oldest === "string" ? "asc" : "desc"
    );

    res.send(await builder);
  } catch (err) {
    next(err);
  }
}
/**
 * publish a draft - this is a one-time operation
 */
async function publishDraft(req, res) {
  const { id } = req.params;
  const knex = await getKnex();
  const [post] = await knex("post")
    .whereNull("published")
    .andWhere({
      user_id: req.loggedInUser.id,
      id
    });
  if (!post) {
    res.status(404).send({});
    return;
  }
  if (!post.canonical) {
    res.status(400).send({
      message: "Error: Can't publish a draft with no canonical URL"
    });
    return;
  }
  await knex("post")
    .update({ published: getMysqlDatetime() })
    .where({
      user_id: req.loggedInUser.id,
      id
    });
  res.send({});
}

/**
 * delete a draft (and content nodes) for logged in user
 */
async function deleteDraftAndContentNodes(req, res) {
  const { id } = req.params;
  const knex = await getKnex();
  const [post] = await knex("post")
    .whereNull("published")
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
  // TODO: transaction
  await knex("content_node")
    .where("post_id", id)
    .del();
  await knex("post")
    .where("id", id)
    .del();

  res.status(204).send({});
}

module.exports = {
  postDraft,
  getDrafts,
  publishDraft,
  deleteDraftAndContentNodes
};
