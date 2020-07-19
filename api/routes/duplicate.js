import { getChecksum } from '../../common/cipher';
import { getKnex } from '../lib/mysql';

async function duplicatePost(req, res, next) {
  try {
    const { currentPost } = req;
    const knex = await getKnex();

    await knex.transaction(async (trx) => {
      const { id, user_id, canonical, title, abstract, meta } = currentPost;

      // post table
      // note this won't publish a published post, user will have to do that again
      await trx('post').insert({
        user_id,
        // canonical needs to be globally unique - concatenating the original with the first 4 chars of the hash of the original & current timestamp should suffice
        canonical: `${canonical}-${getChecksum(
          `${canonical}${Date.now()}`
        ).slice(0, 4)}`,
        title,
        abstract,
        meta: JSON.stringify(meta),
      });

      // MYSQL specific way to get the auto-increment id from the last insert
      const lastInsertId = 'LAST_INSERT_ID()';
      // crazy return value structure:
      // index 0 is an array of values returned by the query, index 1 is an array of database meta data (column names, table names, etc)
      // within array of values is another array of objects keyed off of strings, not sure how that works...
      // in this case it's the custom MySQL function name
      const [[{ [lastInsertId]: newPostId }]] = await trx.raw(
        `SELECT ${lastInsertId}`
      );

      // content_node table
      await trx.raw(
        `INSERT INTO content_node (post_id, id, type, meta, content, next_sibling_id, deleted)
        SELECT ?, id, type, meta, content, next_sibling_id, deleted
        FROM content_node
        WHERE post_id = ?;`,
        [newPostId, id]
      );

      // content_node_history table
      await trx.raw(
        `INSERT INTO content_node_history (post_id, content_node_history_id, meta, deleted)
        SELECT ?, content_node_history_id, meta, deleted
        FROM content_node_history
        WHERE post_id = ?;`,
        [newPostId, id]
      );

      res.send({ newPostId });
    });
  } catch (err) {
    next(err);
  }
}

module.exports = {
  duplicatePost,
};
