require = require('esm')(module /*, options*/);
const { getKnex } = require('./lib/mysql');
const { saneEnvironmentOrExit } = require('@filbert/util');

async function main() {
  const knex = await getKnex();

  const postIds = await knex('post')
    .select('id')
    .orderBy('id', 'asc')
    .map(({ id }) => id);

  for (let i = 0; i < postIds.length; i++) {
    const postId = postIds[i];
    const postHistoryEntries = await knex('content_node_history').where({
      post_id: postId,
    });
    const contentNodes = await knex('content_node').where({post_id: postId})
    if (postHistoryEntries.length === 0) {
        if (contentNodes.length === 0) {
            // no history, no nodes - delete the post
            console.log(`${postId} - no history, no nodes - deleting!`);
        } else {
            // create one history entry per node
            for (let j=0; j<contentNodes.length; j++) {
                const node = contentNodes[j];
                const id = node.id
                const entry = {
                    execute: {
                        historyState: {id: node},
                        selectionOffsets: {startNodeId: id, caretStart: -1}
                    },
                    unexecute: {
                        historyState: {id},
                    }
                }
            }
        }
      console.log(`${postId} - no history, ${contentNodes.length} content nodes`);
    } else if (postHistoryEntries[0].meta.execute) {
        // current - nothing to do
        console.log(`${postId} - current history, ${contentNodes.length} content nodes`);
    } else {
        // old history
        // 1) migrate each history entry to new format


        // 2) delete content nodes

      console.log(`${postId} - old history, ${contentNodes.length} content nodes`);
    }
  }
}
saneEnvironmentOrExit('MYSQL_ROOT_PASSWORD');
main();
