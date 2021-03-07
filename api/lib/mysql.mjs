import knex from 'knex';

import { wrapExec } from './util.mjs';
import { mysqlConnectionConfig } from '@filbert/mysql';
import { documentModelFromJS, DOCUMENT_POST_ID } from '@filbert/document';
import {
  LINKED_LIST_HEAD_ID,
  LINKED_LIST_NODES_MAP,
} from '@filbert/linked-list';

let knexConnection;
export async function getKnex() {
  if (!knexConnection) {
    console.info('Connecting to MySQL...');
    knexConnection = knex({
      client: 'mysql2',
      connection: mysqlConnectionConfig,
      asyncStackTraces: true,
      debug: false,
    });
  }
  return knexConnection;
}

export async function getDocumentModel(postId, currentUndoHistoryId, trx) {
  // TODO: naive approach - get every history entry and build document from the beginning up to currentUndoHistoryId
  const knex = trx || (await getKnex());
  const builder = knex('content_node_history')
    // if not in an undo/redo state, get most recent history
    .where({ post_id: postId, deleted: null })
    .orderBy('content_node_history_id', 'asc');
  // undo/redo state - get history up-to-and-including currentUndoHistoryId
  if (currentUndoHistoryId && currentUndoHistoryId > -1) {
    builder.andWhere('content_node_history_id', '<=', currentUndoHistoryId);
  }

  const historyEntries = await builder;
  const nodesReturn = {};
  let executeSelectionOffsets = {};
  let headReturnId;
  historyEntries.forEach(
    ({
      meta: {
        historyLogEntry: {
          [LINKED_LIST_HEAD_ID]: headId,
          [LINKED_LIST_NODES_MAP]: nodes,
        },
        selectionOffsets,
      },
    }) => {
      // headId will be falsy if it didn't change
      if (headId) {
        headReturnId = headId;
      }
      Object.entries(nodes).forEach(([nodeId, node]) => {
        if (typeof node === 'string') {
          // should these be filtered and applied second after all update states?
          delete nodesReturn[nodeId];
        } else {
          // ensure that only one node points to next, ignore dupes since a node can have multiple history entries
          nodesReturn[nodeId] = node;
        }
      });
      executeSelectionOffsets = selectionOffsets;
    }
  );
  return {
    documentModel: documentModelFromJS({
      [DOCUMENT_POST_ID]: postId,
      [LINKED_LIST_HEAD_ID]: headReturnId,
      [LINKED_LIST_NODES_MAP]: nodesReturn,
    }),
    selectionOffsets: executeSelectionOffsets,
  };
}

export async function makeMysqlDump(now, stagingDirectory) {
  const currentBackupFilename = `${now.getFullYear()}-${(now.getMonth() + 1)
    .toString()
    .padStart(2, '0')}-${now
    .getDate()
    .toString()
    .padStart(2, '0')}_${now
    .getHours()
    .toString()
    .padStart(2, '0')}${now
    .getMinutes()
    .toString()
    .padStart(2, '0')}${now.getSeconds().toString().padStart(2, '0')}.sql`;
  const currentFileAndPath = `${stagingDirectory}/${currentBackupFilename}`;
  // TODO: anyone that can run a `ps -A` can see this password... 🤦‍♀️
  //  use mysql_editor_config to store obfuscated credentials in a .mylogin.cnf
  //  but, the percona docker doesn't create a /home/mysql dir, so need to create a Dockerfile
  //  to customize percona.
  // https://dev.mysql.com/doc/refman/5.6/en/mysql-config-editor.html
  await wrapExec(
    `docker exec $PERCONA_CONTAINER_NAME /usr/bin/mysqldump --hex-blob --default-character-set=utf8mb4 --databases filbert -uroot -p"$MYSQL_ROOT_PASSWORD" --verbose 2>>/var/log/mysqldump.log > ${currentFileAndPath}`
  );
  return { filenameWithAbsolutePath: currentFileAndPath };
}

export async function restoreMysqlFromFile(fileAndPath) {
  const { stderr } = await wrapExec(
    `docker exec -i $PERCONA_CONTAINER_NAME /usr/bin/mysql -uroot -p"$MYSQL_ROOT_PASSWORD" < ${fileAndPath}`
  );
  // TODO: same as above .mylogin.cnf
  if (
    stderr &&
    !stderr.includes(
      '[Warning] Using a password on the command line interface can be insecure'
    )
  ) {
    return { stderr };
  }
  return {};
}

export async function getPostByCanonicalHelper(canonical, loggedInUser) {
  const knex = await getKnex();
  const [post] = await knex('post')
    .select(
      'post.id',
      { userId: 'user.id' },
      { userProfileIsPublic: 'user.is_public' },
      'canonical',
      'title',
      'abstract',
      'published',
      'post.meta',
      'username',
      { profilePictureUrl: 'user.picture_url' },
      { familyName: 'family_name' },
      { givenName: 'given_name' }
    )
    .innerJoin('user', 'post.user_id', 'user.id')
    .whereNotNull('published')
    .andWhere({ canonical });

  if (!post) {
    return;
  }

  if (loggedInUser) {
    post.canEdit = loggedInUser.userId === post.userId;
    post.canDelete = loggedInUser.userId === post.userId;
    post.canPublish = loggedInUser.userId === post.userId;
  }
  if (
    !post.userProfileIsPublic &&
    (!loggedInUser || loggedInUser.userId !== post.userId)
  ) {
    delete post.profilePictureUrl;
    delete post.familyName;
    delete post.givenName;
  }
  delete post.userId;
  return post;
}
