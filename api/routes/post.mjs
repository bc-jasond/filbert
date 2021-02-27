import { getMysqlDatetime } from '@filbert/mysql';

import {
  getKnex,
  getDocumentModel,
  getPostByCanonicalHelper,
} from '../lib/mysql.mjs';
import {
  getFirstPhotoAndAbstractFromContent,
  addFirstPhotoTitleAndAbstractToPosts,
} from '../lib/post-util.mjs';

export async function getPosts(req, res) {
  const {
    session: { user: loggedInUser },
    query: { username, oldest, random },
  } = req;
  const knex = await getKnex();
  let builder = knex('post')
    .select(
      'post.id',
      { userId: 'user.id' },
      { userProfileIsPublic: 'user.is_public' },
      'canonical',
      'title',
      'abstract',
      'post.created',
      'updated',
      'published',
      'post.deleted',
      'post.meta',
      'username',
      { profilePictureUrl: 'user.picture_url' },
      { familyName: 'family_name' },
      { givenName: 'given_name' }
    )
    .innerJoin('user', 'post.user_id', 'user.id')
    .whereRaw('published IS NOT NULL AND post.deleted IS NULL')
    .limit(1000);

  if (username) {
    builder = builder.andWhere('username', 'like', `%${username}%`);
  }

  if (typeof random === 'string') {
    /* TODO: implement
     1) select all published post ids in the the DB
     2) use Fisher Yates to fill up 100 random ids (swap from whole list, break at 100) for a WHERE IN clause
     3) add whereIn() to the builder
     */
  }

  builder = builder.orderBy(
    'published',
    typeof oldest === 'string' ? 'asc' : 'desc'
  );

  let posts = await builder;
  posts = await addFirstPhotoTitleAndAbstractToPosts(posts);

  if (!loggedInUser) {
    res.send(posts);
    return;
  }

  res.send(
    // TODO: add to query above instead of looping here
    posts.map((post) => {
      // keep users info private if they don't want to share it!
      if (!post.userProfileIsPublic && loggedInUser.userId !== post.userId) {
        delete post.userId;
        delete post.profilePictureUrl;
        delete post.familyName;
        delete post.givenName;
      }
      post.canEdit = loggedInUser.userId === post.userId;
      post.canDelete = loggedInUser.userId === post.userId;
      post.canPublish = loggedInUser.userId === post.userId;
      return post;
    })
  );
}

// returns both post and content
export async function getPostByCanonical(req, res) {
  const {
    session: { user: loggedInUser },
  } = req;
  const { canonical } = req.params;

  const post = await getPostByCanonicalHelper(canonical, loggedInUser);
  if (!post) {
    res.status(404).send({});
    return;
  }

  const postCanonical = canonical;
  const knex = await getKnex();
  const allPosts = await knex('post')
    .select('canonical')
    .innerJoin('user', 'post.user_id', 'user.id')
    .whereNotNull('published')
    .andWhere({ username: post.username, 'post.deleted': null })
    .orderBy('published', 'asc')
    .map(({ canonical }) => canonical);

  let postIdx;
  for (let i = 0; i < allPosts.length; i++) {
    if (postCanonical === allPosts[i]) {
      postIdx = i;
      break;
    }
  }
  if (typeof postIdx === 'undefined') {
    // WTF?
  }
  const prevPostCanonical =
    postIdx === 0 ? allPosts[allPosts.length - 1] : allPosts[postIdx - 1];
  const prevPost = await getPostByCanonicalHelper(
    prevPostCanonical,
    loggedInUser
  );
  const nextPostCanonical =
    postIdx === allPosts.length - 1 ? allPosts[0] : allPosts[postIdx + 1];
  const nextPost = await getPostByCanonicalHelper(
    nextPostCanonical,
    loggedInUser
  );
  const {documentModel} = await getDocumentModel(post.id);

  res.send({ prevPost, nextPost, post, head: documentModel.head, contentNodes: documentModel.nodes });
}

// returns only post
export async function getPostById(req, res) {
  const { currentPost } = req;
  // remove user_id...
  res.send({ post: { ...currentPost, user_id: undefined } });
}

/**
 * save post fields - like title, canonical & abstract
 */
export async function patchPost(req, res, next) {
  try {
    const { user: { userId: loggedInUserId } = {} } = req.session;
    const { id } = req.currentPost;
    const { title, canonical, abstract, photoUrl, meta } = req.body;
    const patchValues = {};
    if (typeof title !== 'undefined') {
      patchValues.title = title;
    }
    if (typeof canonical !== 'undefined') {
      patchValues.canonical = canonical;
    }
    if (typeof abstract !== 'undefined') {
      patchValues.abstract = abstract;
    }
    if (typeof photoUrl !== 'undefined') {
      patchValues.photo_url = photoUrl;
    }
    if (typeof meta !== 'undefined') {
      patchValues.meta = JSON.stringify(meta);
    }
    const knex = await getKnex();
    const result = await knex('post')
      .update(patchValues)
      .whereNull('deleted')
      .andWhere({
        user_id: loggedInUserId,
        id,
      });
    res.send({});
  } catch (err) {
    next(err);
  }
}

export async function getSummaryAndPhotoFromContent(req, res) {
  const { id } = req.currentPost;
  const responseData = {};
  const {documentModel} = await getDocumentModel(id);

  if (!documentModel.size) {
    res.send(responseData);
  }
  res.send(getFirstPhotoAndAbstractFromContent(documentModel));
}

/**
 * delete a PUBLISHED post
 */
export async function deletePublishedPost(req, res) {
  const { id } = req.currentPost;
  const knex = await getKnex();
  /**
   * DANGER ZONE!!!
   */
  const deleted = getMysqlDatetime();
  await knex('content_node_history').update({ deleted }).where('post_id', id);
  await knex('content_node').update({ deleted }).where('post_id', id);
  await knex('post').update({ deleted }).where('id', id);
  res.status(204).send({});
}
