const { performance } = require('perf_hooks');
const { getKnex } = require('../lib/mysql');

// for "is username taken?" - add ?forSignup
async function getUser(req, res) {
  const {
    query: { forSignup },
    params: { username },
    session: { user: loggedInUser },
  } = req;
  const isCheckingAvailability = typeof forSignup === 'string';
  if (!username) {
    res.status(404).send({});
    return;
  }
  if (isCheckingAvailability && (username.length < 5 || username.length > 42)) {
    res.status(404).send({});
    return;
  }
  const knex = await getKnex();
  // TODO: one-time token to prevent abuse?
  if (isCheckingAvailability) {
    const [user] = await knex('user')
      .select('username')
      .where('username', username);
    if (!user) {
      res.status(404).send({});
    }
    res.send({});
    return;
  }
  let builder = knex('user')
    .column(
      { userId: 'id' },
      'username',
      'email',
      { givenName: 'given_name' },
      { familyName: 'family_name' },
      { pictureUrl: 'picture_url' },
      'created',
      'iss',
      { profileIsPublic: 'is_public' },
      { statsArePublic: 'show_stats' }
    )
    .select()
    .where('username', username);

  if (
    !(
      loggedInUser &&
      loggedInUser.username &&
      loggedInUser.username === username
    )
  ) {
    builder = builder.where('is_public', true);
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
    session: {
      user: { userId: id },
    },
  } = req;
  let updateCount = 0;
  const update = {};
  if (typeof profileIsPublic !== 'undefined') {
    updateCount += 1;
    update.is_public = profileIsPublic;
  }
  if (typeof statsArePublic !== 'undefined') {
    updateCount += 1;
    update.show_stats = statsArePublic;
  }
  if (updateCount > 0) {
    const knex = await getKnex();
    const result = await knex('user')
      .update({ is_public: profileIsPublic, show_stats: statsArePublic })
      .where({ id });
  }
  res.send({});
}

async function getStats(req, res, next) {
  try {
    const {
      params: { username },
      session: { user: loggedInUser },
    } = req;
    const start = performance.now();
    const knex = await getKnex();
    console.log('GET STATS loggedInUser', loggedInUser);
    let builder = knex('user').where({ username });
    if (!loggedInUser || username !== loggedInUser.username) {
      builder = builder.andWhere({ show_stats: 1 });
    }
    const [user] = await builder;
    if (!user) {
      res.status(404).send({});
      return;
    }
    // TODO: this is just quick 'n dirty.  Since historical data doesn't change, this can be calculated and stored
    //  in a stats table once a day
    const { id: userId } = user;
    const stats = {};
    stats.totalPostsPublished = 0;
    stats.totalWords = 0;
    stats.totalCharacters = 0;
    stats.totalImages = 0;
    stats.totalQuotes = 0;
    stats.currentStreak = null;
    stats.longestStreak = null;
    stats.longestStreakStart = null;
    stats.longestStreakEnd = null;
    const allWordsSeen = {};
    const countsByPostId = {};
    const splitAndCount = (str, postId) => {
      const matched = str.match(/\w+/gi);
      if (!matched) {
        return;
      }
      matched.forEach((word) => {
        stats.totalWords += 1;
        const lc = word.toLowerCase();
        if (
          lc.length > 3 &&
          !['that', 'this', 'with', 'have', 'what'].includes(lc)
        ) {
          if (!allWordsSeen.hasOwnProperty(lc)) {
            allWordsSeen[lc] = 0;
          }
          allWordsSeen[lc] += 1;
          if (!countsByPostId.hasOwnProperty(postId)) {
            countsByPostId[postId] = 0;
          }
          countsByPostId[postId] += 1;
        }
      });
    };
    const addChars = (str) => {
      stats.totalCharacters += str.length;
    };
    const getFormattedDate = (date) =>
      `${date.getFullYear()}${date
        .getMonth()
        .toString()
        .padStart(2, '0')}${date.getDate().toString().padStart(2, '0')}`;

    const seenDays = new Set();
    const allPosts = await knex('post').where({ user_id: userId });
    stats.totalPosts = allPosts.length;
    allPosts.forEach(({ id, created, updated, published, title, abstract }) => {
      if (published) {
        stats.totalPostsPublished += 1;
      }
      seenDays.add(getFormattedDate(created));
      seenDays.add(getFormattedDate(updated));
      if (published) {
        seenDays.add(getFormattedDate(published));
      }
      addChars(`${title}${abstract}`);
      splitAndCount(`${title} ${abstract}`, id);
    });

    const allContentNodes = await knex('content_node')
      .column(
        'user_id',
        'post_id',
        { created: 'content_node.created' },
        { updated: 'content_node.updated' },
        'type',
        'content',
        { meta: 'content_node.meta' }
      )
      .innerJoin('post', 'post.id', 'content_node.post_id')
      .where({ 'post.user_id': userId });

    allContentNodes.forEach(
      ({
        post_id,
        type,
        content,
        meta: { caption = '', quote = '', author = '', context = '' },
        created,
        updated,
      }) => {
        seenDays.add(getFormattedDate(created));
        seenDays.add(getFormattedDate(updated));
        if (['p', 'li', 'h1', 'h2', 'pre'].includes(type)) {
          addChars(content);
          splitAndCount(content, post_id);
        } else if (type === 'image') {
          stats.totalImages += 1;
          addChars(caption);
          splitAndCount(caption, post_id);
        } else if (type === 'quote') {
          stats.totalQuotes += 1;
          addChars(`${quote}${author}${context}`);
          splitAndCount(`${quote} ${author} ${context}`, post_id);
        }
      }
    );
    const favoriteWords = [];
    for (const word in allWordsSeen) {
      favoriteWords.push({ word, count: allWordsSeen[word] });
    }
    favoriteWords.sort(({ count }, { count: count2 }) =>
      count > count2 ? -1 : 1
    );
    stats.favoriteWords = favoriteWords.slice(0, 3);
    stats.averagePostWordLength = Math.floor(
      stats.totalWords / stats.totalPosts
    );
    const postWordCounts = [];
    for (const postId in countsByPostId) {
      postWordCounts.push(countsByPostId[postId]);
    }
    // sort dates asc
    postWordCounts.sort((a, b) => (a > b ? -1 : 1));
    stats.longestPostWords = postWordCounts[0];
    // streaks
    const dates = [];
    for (const date of seenDays) {
      dates.push(parseInt(date, 10));
    }
    dates.sort((a, b) => (a > b ? 1 : -1));
    let [currentStart] = dates;
    let [currentEnd] = dates;
    let [longestStart] = dates;
    let [longestEnd] = dates;
    dates.forEach((date) => {
      if (date - currentEnd > 1) {
        if (currentEnd - currentStart >= longestEnd - longestStart) {
          longestStart = currentStart;
          longestEnd = currentEnd;
        }
        currentStart = date;
        currentEnd = date;
      } else {
        currentEnd = date;
      }
    });

    const now = new Date();
    let today = parseInt(getFormattedDate(now), 10);
    if (currentStart !== today && currentEnd !== today) {
      stats.currentStreak = 0;
    } else {
      stats.currentStreak = currentEnd - currentStart + 1;
    }
    stats.longestStreak = longestEnd - longestStart + 1;
    stats.longestStreakStart = longestStart;
    stats.longestStreakEnd = longestEnd;

    console.info(
      `User Stats for ${username} took ${
        Math.round(performance.now() - start) / 1000
      } seconds.`
    );
    res.send(stats);
  } catch (err) {
    next(err);
  }
}

async function patchPreferences(req, res) {
  const {
    body: { theme, font },
    session: { user: { userId: id } = {}, preferences = {} },
  } = req;
  if (theme) {
    req.session.preferences = { ...preferences, theme };
  }
  if (font) {
    req.session.preferences = { ...preferences, font };
  }
  if (id) {
    // TODO: use JSON_MERGE_PATCH() instead of SELECT & UPDATE?
    const knex = await getKnex();
    const [{ meta }] = await knex('user').select('meta').where({ id });
    const oldMeta = meta ?? {};
    await knex('user')
      .update({
        meta: JSON.stringify({
          ...oldMeta,
          preferences: req.session.preferences,
        }),
      })
      .where({ id });
  }
  res.send({});
}

module.exports = {
  getUser,
  patchProfile,
  getStats,
  patchPreferences,
};
