import { head, getNext } from '@filbert/linked-list';
import {
  type,
  contentClean,
  NODE_TYPE_IMAGE,
  NODE_TYPE_P,
  NODE_TYPE_LI,
  NODE_TYPE_PRE,
  NODE_TYPE_H1,
  NODE_TYPE_H2,
} from '@filbert/document';
import { getKnex, getDocumentModel } from './mysql.mjs';

export function ensureNoOrphanedNodes(contentNodes, postId) {}

/**
 * Populates Post Image, Post Title, and Post Abstract from its content
 *
 * @param contentNodes - a hash of content nodes keyed by id
 */
export function getFirstPhotoAndAbstractFromContent(documentModel) {
  const responseData = {};
  const titleMinLength = 2;
  const titleMaxLength = 75;
  const abstractMinLength = 100;
  const abstractMaxLength = 200;
  const queue = [head(documentModel)];
  while (
    queue.length &&
    (!responseData.abstract || !responseData.imageNode || !responseData.title)
  ) {
    const current = queue.shift();
    if (!current.size) {
      console.warn('Falsy node in the queue...');
      continue;
    }
    if (!responseData.imageNode && type(current) === NODE_TYPE_IMAGE) {
      responseData.imageNode = current;
    }
    if (
      [
        NODE_TYPE_P,
        NODE_TYPE_LI,
        NODE_TYPE_PRE,
        NODE_TYPE_H1,
        NODE_TYPE_H2,
      ].includes(type(current))
    ) {
      // replace all whitespace chars with a single space
      const currentContent = contentClean(current).replace(/\s\s+/g, ' ');
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
    const next = getNext(documentModel);
    if (next.size) {
      queue.push(next);
    }
  }
  return responseData;
}

export async function addFirstPhotoTitleAndAbstractToPosts(posts) {
  const draftsModified = [];
  for (let i = 0; i < posts.length; i++) {
    const draft = posts[i];
    let title, abstract, imageNode;
    const { syncTopPhoto, syncTitleAndAbstract } = draft.meta;
    if (syncTopPhoto || syncTitleAndAbstract) {
      const { documentModel } = await getDocumentModel(draft.id);
      ({ title, abstract, imageNode } = getFirstPhotoAndAbstractFromContent(
        documentModel
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

export async function assertUserHasPost(req, res, next) {
  try {
    const {
      params: { postId },
      session: { user: { userId } = {} },
    } = req;
    const knex = await getKnex();
    const [post] = await knex('post').where({
      id: postId,
      user_id: userId,
    });
    if (!post) {
      res.status(404).send({});
      return;
    }
    // make post available to next middlewares
    req.currentPost = post;
    next();
  } catch (err) {
    console.error('assertUserHasPost Error: ', err);
    res.status(500).send({});
  }
}
