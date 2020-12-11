import { getMysqlDatetime } from '@filbert/mysql';
import { getKnex } from '../lib/mysql.mjs';
import { addFirstPhotoTitleAndAbstractToPosts } from '../lib/post-util.mjs';
/**
 * creates a new draft for logged in user
 */
export async function postDraft(req, res) {
  const user_id = req.session.user.userId;
  const { title, canonical, meta } = req.body;
  const insertValues = { user_id, title, canonical };
  insertValues.meta = JSON.stringify(
    meta || { syncTitleAndAbstract: true, syncTopPhoto: true }
  );
  const knex = await getKnex();
  const [postId] = await knex.insert(insertValues).into('post');
  res.send({ postId });
}
/**
 * list drafts for logged in user
 */
export async function getDrafts(req, res, next) {
  try {
    const {
      query: { contains, oldest, random },
      session: { user },
    } = req;
    const knex = await getKnex();
    let builder = knex('post')
      .select(
        'post.id',
        'user_id',
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
        { givenName: 'given_name' },
        // the following are always true for drafts
        knex.raw(`1 as 'canEdit'`),
        knex.raw(`1 as 'canDelete'`),
        knex.raw(`1 as 'canPublish'`),
        knex.raw(`1 as 'userProfileIsPublic'`)
      )
      .innerJoin('user', 'post.user_id', 'user.id')
      .where({
        'post.user_id': user.userId,
        published: null,
        'post.deleted': null,
      })
      .limit(1000);

    if (typeof contains === 'string') {
      builder = builder.andWhereRaw(
        'MATCH (title,abstract) AGAINST (? IN BOOLEAN MODE)',
        [contains]
      );
    }

    if (typeof random === 'string') {
      /* TODO: implement random
       1) select all published post ids in the the DB
       2) use Fisher Yates to fill up 100 random ids (swap from whole list, break at 100) for a WHERE IN clause
       3) add whereIn() to the builder
       */
    }

    builder = builder.orderBy(
      'post.created',
      typeof oldest === 'string' ? 'asc' : 'desc'
    );

    // TODO: move this calculation to edit.jsx -> sync content to post as user makes edits
    const drafts = await builder;
    res.send(await addFirstPhotoTitleAndAbstractToPosts(drafts));
  } catch (err) {
    next(err);
  }
}
/**
 * publish a draft - this is a one-time operation
 */
export async function publishDraft(req, res) {
  const { currentPost } = req;
  if (currentPost.published) {
    res.status(404).send({});
    return;
  }
  if (!currentPost.canonical) {
    res.status(400).send({
      message: "Error: Can't publish a draft without a canonical URL",
    });
    return;
  }
  const knex = await getKnex();
  await knex('post').update({ published: getMysqlDatetime() }).where({
    user_id: req.session.user.userId,
    id: currentPost.id,
  });
  res.send({});
}

/**
 *
 * delete a draft (and content nodes) for logged in user
 */
export async function deleteDraftAndContentNodes(req, res) {
  const { id } = req.currentPost;
  const knex = await getKnex();
  /**
   * DANGER ZONE!!!
   * aptly named.  That's why it's marked deleted instead of actually deleted now.
   */
  const deleted = getMysqlDatetime();
  await knex.transaction(async (trx) => {
    await trx('content_node_history').update({ deleted }).where('post_id', id);
    await trx('content_node').update({ deleted }).where('post_id', id);
    await trx('post').update({ deleted }).where('id', id);

    res.status(204).send({});
  });
}
