const { getKnex } = require("../lib/mysql");

async function getUser(req, res) {
  const {
    query: { forSignup },
    params: { username },
    loggedInUser
  } = req;
  if (!username) {
    res.status(404).send({});
    return;
  }
  if (username.length < 5 || username.length > 42) {
    res.status(404).send({});
    return;
  }
  const knex = await getKnex();
  // TODO: one-time token to prevent abuse?
  if (typeof forSignup === "string") {
    const [user] = await knex("user")
      .select("username")
      .where("username", username);
    if (!user) {
      res.status(404).send({});
    }
    res.send({});
    return;
  }
  let builder = knex("user")
    .column(
      { userId: "id" },
      "username",
      "email",
      { givenName: "given_name" },
      { familyName: "family_name" },
      { pictureUrl: "picture_url" },
      "created",
      "iss",
      { profileIsPublic: "is_public" },
      { statsArePublic: "show_stats" }
    )
    .select()
    .where("username", username);

  if (
    !(
      loggedInUser &&
      loggedInUser.username &&
      loggedInUser.username === username
    )
  ) {
    builder = builder.where("is_public", true);
  }

  const [user] = await builder;
  if (!user) {
    res.status(404).send({});
  }
  res.send(user);
}

async function patchProfile(req, res) {
  const {
    body: { profileIsPublic, statsArePublic } = {},
    loggedInUser: { id }
  } = req;
  let updateCount = 0;
  const update = {};
  if (typeof profileIsPublic !== "undefined") {
    updateCount += 1;
    update.is_public = profileIsPublic;
  }
  if (typeof statsArePublic !== "undefined") {
    updateCount += 1;
    update.show_stats = statsArePublic;
  }
  if (updateCount > 0) {
    const knex = await getKnex();
    const result = await knex("user")
      .update({ is_public: profileIsPublic, show_stats: statsArePublic })
      .where({ id });
  }
  res.send({});
}

module.exports = {
  getUser,
  patchProfile
};
