const { getKnex, getNodesFlat } = require("./mysql");
const { getFirstNode } = require("./util");

/**
 * Populates Post Image, Post Title, and Post Abstract from its content
 *
 * @param contentNodes - a hash of content nodes keyed by id
 */
function getFirstPhotoAndAbstractFromContent(contentNodes, postId) {
  const responseData = {};
  const titleMinLength = 2;
  const titleMaxLength = 75;
  const abstractMinLength = 100;
  const abstractMaxLength = 200;
  const queue = [getFirstNode(contentNodes, postId)];
  while (
    queue.length &&
    (!responseData.abstract || !responseData.imageNode || !responseData.title)
  ) {
    const current = queue.shift();
    if (!current) {
      console.warn("Falsy node in the queue...");
      continue;
    }
    if (!responseData.imageNode && current.type === "image") {
      responseData.imageNode = current;
    }
    if (["p", "li", "pre", "h1", "h2"].includes(current.type)) {
      // replace all whitespace chars with a single space
      const currentContent = current.content.replace(/\s\s+/g, " ");
      if (currentContent) {
        if (!responseData.title || responseData.title.length < titleMinLength) {
          if (!responseData.title) {
            responseData.title = currentContent;
          } else {
            responseData.title = `${responseData.title} ${currentContent}`;
          }
          if (responseData.title.length > titleMinLength) {
            responseData.title = responseData.title.substring(
              0,
              titleMaxLength
            );
          }
        } else if (
          !responseData.abstract ||
          responseData.abstract.length < abstractMinLength
        ) {
          if (!responseData.abstract) {
            responseData.abstract = currentContent;
          } else {
            responseData.abstract = `${responseData.abstract} ${currentContent}`;
          }
          if (responseData.abstract.length > abstractMinLength) {
            responseData.abstract = responseData.abstract.substring(
              0,
              abstractMaxLength
            );
          }
        }
      }
    }
    const next = contentNodes[current.next_sibling_id];
    if (next) {
      queue.push(next);
    }
  }
  return responseData;
}

async function addFirstPhotoTitleAndAbstractToPosts(posts) {
  const knex = await getKnex();
  const draftsModified = [];
  for (let i = 0; i < posts.length; i++) {
    const draft = posts[i];
    let title, abstract, imageNode;
    const { syncTopPhoto, syncTitleAndAbstract } = draft.meta;
    if (syncTopPhoto || syncTitleAndAbstract) {
      const contentNodes = await getNodesFlat(draft.id);
      ({ title, abstract, imageNode } = getFirstPhotoAndAbstractFromContent(
        contentNodes,
        draft.id
      ));
    }
    if (syncTitleAndAbstract) {
      draft.title = title;
      draft.abstract = abstract;
    }
    if (syncTopPhoto) {
      draft.meta.imageNode = imageNode;
    }
    draftsModified[i] = draft;
  }
  return draftsModified;
}

async function assertUserHasPost(req, res, next) {
  try {
    const {
      params: { postId },
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
    // make post available to next middlewares
    req.currentPost = post;
    next();
  } catch (err) {
    console.error("assertUserHasPost Error: ", err);
    res.status(500).send({});
  }
}

module.exports = {
  getFirstPhotoAndAbstractFromContent,
  addFirstPhotoTitleAndAbstractToPosts,
  assertUserHasPost,
};
