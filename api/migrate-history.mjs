import { getKnex, getDocumentModel } from './lib/mysql.mjs';
import { postContentNodeHistory } from './routes/content-node-history.mjs';
import { saneEnvironmentOrExit } from '@filbert/util';
import {
  DocumentModel,
} from '@filbert/document';
import { HistoryManager, historyStateIsValid } from '@filbert/history';
import immutable from 'immutable';

const { Map, fromJS, List } = immutable;

async function main() {
  const knex = await getKnex();

  const posts = await knex('post').orderBy('id', 'asc');

  for (let i = 0; i < posts.length; i++) {
    const post = posts[i];
    const postId = post.id;
    const postHistoryEntries = await knex('content_node_history').where({
      post_id: postId,
    });
    const contentNodes = await knex('content_node').where({ post_id: postId });
    if (postHistoryEntries.length === 0) {
      if (contentNodes.length === 0) {
        // no history, no nodes - delete the post
        console.log(`${postId} - no history, no nodes - deleting!`);
        await knex('post').where({ id: postId }).del();
      } else {
        // create one history entry per node
        // add all nodes to document model first to pass integrity checks for next_sibling_id
        let nodesById = contentNodes.reduce(
          (acc, node) => acc.set(node.id, Map(node)),
          Map()
        );
        nodesById = fixOrphanedNodes(nodesById);

        const document = DocumentModel(postId, nodesById.toJS());
        const historyManager = HistoryManager(postId, {});

        const firstNode = getFirstNode(nodesById);
        let currentNode = firstNode;
        let currentOffsets = {
          startNodeId: currentNode.get('id'),
          caretStart: -1,
        };
        let prevNode = Map();
        let prevOffsets = {};
        const seen = new Set();
        while (currentNode && !seen.has(currentNode.get('id'))) {
          seen.add(currentNode.get('id'));
          const historyState = document.update(currentNode);
          historyManager.appendToHistoryLog({
            selectionOffsets: currentOffsets,
            historyState,
          });
          prevNode = currentNode;
          prevOffsets = currentOffsets;
          currentNode = nodesById.get(currentNode.get('next_sibling_id'));
          currentOffsets.startNodeId = currentNode?.get?.('id');
        }
        await postContentNodeHistory(
          post,
          historyManager.getLocalHistoryLog().map((entry) => entry.toJS())
        );
        // TODO: delete content nodes for this post
        console.log(
          `${postId} - no history, ${
            contentNodes.length
          } content nodes, first node: ${firstNode.get('id')}`
        );
        console.log(
          `  NEW history log (${
            historyManager.getLocalHistoryLog().length
          } entries)`
        ); //, historyManager.getLocalHistoryLog().map(entry => entry.toJS()))
      }
    } else if (postHistoryEntries[0].meta.execute) {
      // almost current - remove 'unexecute' portion
      console.log(
        `${postId} - *almost* current history, ${contentNodes.length} content nodes`
      );
    } else {
      // old history - just delete it!
      await knex('content_node_history').where({ post_id: postId }).del();

      console.log(
        `${postId} - old history, ${contentNodes.length} content nodes`,
        postHistoryEntries.length
      );
    }
  }
}
saneEnvironmentOrExit('MYSQL_ROOT_PASSWORD');
main();
