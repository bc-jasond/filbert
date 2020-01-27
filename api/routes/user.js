const { performance } = require("perf_hooks");
const { getKnex } = require("../lib/mysql");

// for "is username taken?" - add ?forSignup
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

async function getStats(req, res, next) {
  try {
    const {
      params: { username },
      loggedInUser
    } = req;
    const start = performance.now();
    const knex = await getKnex();
    let builder = knex("user").where({ username });
    if (!loggedInUser || username !== loggedInUser.username) {
      builder = builder.andWhere({ show_stats: 1 });
    }
    const [user] = await builder;
    if (!user) {
      res.status(404).send({});
    }
    const { id: userId } = user;
    const stats = {};
    const allPosts = await knex("post").where({ user_id: userId });
    stats.totalPosts = allPosts.length;
    stats.totalPostsPublished = allPosts.filter(p => p.published).length;
    stats.totalWords = 0;
    stats.totalCharacters = 0;
    stats.totalImages = 0;
    stats.totalQuotes = 0;
  
    const allWordsSeen = {};
    const allContentNodes = await knex("content_node")
      .innerJoin("post", "post.id", "content_node.post_id")
      .where({ "post.user_id": userId });
    const splitAndCount = str => {
      const matched = str.match(/\w+/gi);
      if (!matched) {
        return;
      }
      matched.forEach(word => {
        stats.totalWords += 1;
        const lc = word.toLowerCase();
        if (lc.length > 2 && !["the", "and"].includes(lc)) {
          if (!allWordsSeen.hasOwnProperty(lc)) {
            allWordsSeen[lc] = 0;
          }
          allWordsSeen[lc] += 1;
        }
      });
    };
    const addChars = str => {
      stats.totalCharacters += str.length;
    };
    allContentNodes.forEach(
      ({
         type,
         content,
         meta: { caption = "", quote = "", author = "", context = "" }
       }) => {
        if (["p", "li", "h1", "h2", "pre"].includes(type)) {
          addChars(content);
          splitAndCount(content);
        } else if (type === "image") {
          stats.totalImages += 1;
          addChars(content);
          splitAndCount(caption);
        } else if (type === "quote") {
          stats.totalQuotes += 1;
          addChars(`${quote}${author}${context}`);
          splitAndCount(`${quote} ${author} ${context}`);
        }
      }
    );
    let favoriteWords = [];
    for (const word in allWordsSeen) {
      favoriteWords.push({ word, count: allWordsSeen[word] });
    }
    favoriteWords.sort(({ count }, { count: count2 }) =>
      count > count2 ? -1 : 1
    );
    stats.favoriteWords = favoriteWords.slice(0, 3);
    console.info(
      `User Stats for ${username} took ${Math.round(performance.now() - start) /
      1000} seconds.`
    );
    res.send(stats);
  } catch(err) {
    next(err);
  }
}

module.exports = {
  getUser,
  patchProfile,
  getStats
};
