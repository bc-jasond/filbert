import { getKnex } from '../lib/mysql.mjs';
import { postContentNodeHistory } from './content-node-history.mjs';

function pruneOrphanedNodesFromUpdates(updates) {}

/**
 * takes a list of 1 or more content nodes to update or delete for a post during edit
 */
export async function postContentNodes(req, res) {
  try {
    // validate post
    const {
      body: { contentNodeHistoryLog },
      currentPost,
    } = req;
    const { id: postId, meta: postMeta } = currentPost;
    const { currentUndoHistoryId } = postMeta;
    const knex = await getKnex();

    await knex.transaction(async (trx) => {
      // 1) save history
      let contentNodeHistoryLogResult;
      if (contentNodeHistoryLog) {
        contentNodeHistoryLogResult = await postContentNodeHistory(
          currentPost,
          contentNodeHistoryLog,
          trx
        );
      }

      // 2) reset post undo history cursor to -1 if in "undo" state
      let updatedPost;
      if (currentUndoHistoryId !== -1) {
        await trx('post')
          .update({
            meta: JSON.stringify({
              ...postMeta,
              currentUndoHistoryId: -1,
              lastActionWasUndo: false,
            }),
          })
          .where({ id: postId });

        // read back updated post
        [updatedPost] = await trx('post').where({ id: postId });
      }

      res.send({
        contentNodeHistoryLogResult,
        updatedPost,
      });
    });
  } catch (err) {
    console.error('POST /content Error: ', err);
    res.status(500).send({});
  }
}
