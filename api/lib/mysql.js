const knex = require("knex");

const { wrapExec } = require("./util");

let knexConnection;

export async function getKnex() {
  if (!knexConnection) {
    console.info("Connecting to MySQL...");
    knexConnection = knex({
      client: "mysql2",
      connection: {
        host: process.env.NODE_ENV === "production" ? "db" : "localhost", // docker-compose.yml service name
        user: "root",
        password: process.env.MYSQL_ROOT_PASSWORD,
        database: "filbert",
      },
      asyncStackTraces: true,
      debug: true,
    });
  }
  return knexConnection;
}

export function getMysqlDatetime(date = null) {
  if (date && !(date instanceof Date)) {
    throw new Error(`getMysqlDatetime: ${date} isn't a built-in JS Date()`);
  }
  const dateInstance = date || new Date();
  // dirty! https://stackoverflow.com/a/15103764/1991322
  return (
    dateInstance.getFullYear() +
    "-" +
    ("0" + (dateInstance.getMonth() + 1)).slice(-2) +
    "-" +
    ("0" + dateInstance.getDate()).slice(-2) +
    " " +
    ("0" + dateInstance.getHours()).slice(-2) +
    ":" +
    ("0" + dateInstance.getMinutes()).slice(-2) +
    ":" +
    ("0" + dateInstance.getSeconds()).slice(-2)
  );
}

export async function getNodes(knex, postId) {
  const nodesArray = await knex("content_node")
    .where("post_id", postId)
    .orderBy(["parent_id", "position"]);

  // group nodes by parent_id, sorted by position
  return nodesArray.reduce((acc, node) => {
    if (!acc[node.parent_id]) {
      acc[node.parent_id] = [];
    }
    acc[node.parent_id].push(node);
    return acc;
  }, {});
}

export async function getNodesFlat(knex, postId) {
  const nodesArray = await knex("content_node").where("post_id", postId);

  // flat map of nodeId => node
  return nodesArray.reduce((acc, node) => {
    acc[node.id] = node;
    return acc;
  }, {});
}

// TODO: 'touch' post on each update/delete of content or publish
async function markPostUpdated(postId) {}

/**
 * batch updates, note this is all vanilla JS, so remember to convert from Immutable
 *
 * @param records [
 *                  [
 *                    "ea32", // nodeId
 *                    {
 *                      post_id: 1, // postId - will override one in "node" if present
 *                      node: {} // Map().toJS()
 *                    }
 *                  ],
 *                  ...
 *                ]
 * @returns {Knex.Raw<TResult>}
 */
export async function bulkContentNodeUpsert(records) {
  if (records.length === 0) return;
  const knexInstance = await getKnex();
  const query = `
    INSERT INTO content_node (post_id, id, next_sibling_id, type, content, meta) VALUES
    ${records.map(() => "(?)").join(",")}
    ON DUPLICATE KEY UPDATE
    next_sibling_id = VALUES(next_sibling_id),
    type = VALUES(type),
    content = VALUES(content),
    meta = VALUES(meta)`;

  const values = [];

  records.forEach(([nodeId, update]) => {
    const { post_id, node } = update;
    values.push([
      post_id,
      nodeId,
      node.next_sibling_id || null,
      node.type,
      node.content || "",
      JSON.stringify(node.meta || {}),
    ]);
  });

  return knexInstance.raw(query, values);
}

export async function bulkContentNodeDelete(records) {
  // delete all records WHERE id IN (...recordIds) OR WHERE parent_id IN (...recordIds)
  if (records.length === 0) return;
  const postId = records[0][1].post_id;
  const recordIds = records.map((r) => r[0]);
  const knexInstance = await getKnex();
  return knexInstance("content_node")
    .whereIn("id", recordIds)
    .andWhere("post_id", postId)
    .del();
}

export async function makeMysqlDump(now, stagingDirectory) {
  const currentBackupFilename = `${now.getFullYear()}-${(now.getMonth() + 1)
    .toString()
    .padStart(2, "0")}-${now
    .getDate()
    .toString()
    .padStart(2, "0")}_${now
    .getHours()
    .toString()
    .padStart(2, "0")}${now
    .getMinutes()
    .toString()
    .padStart(2, "0")}${now.getSeconds().toString().padStart(2, "0")}.sql`;
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
      "[Warning] Using a password on the command line interface can be insecure"
    )
  ) {
    return { stderr };
  }
  return {};
}

export async function getPostByCanonicalHelper(canonical, loggedInUser) {
  const knex = await getKnex();
  const [post] = await knex("post")
    .select(
      "post.id",
      { userId: "user.id" },
      { userProfileIsPublic: "user.is_public" },
      "canonical",
      "title",
      "abstract",
      "published",
      "post.meta",
      "username",
      { profilePictureUrl: "user.picture_url" },
      { familyName: "family_name" },
      { givenName: "given_name" }
    )
    .innerJoin("user", "post.user_id", "user.id")
    .whereNotNull("published")
    .andWhere({ canonical });

  if (loggedInUser) {
    post.canEdit = loggedInUser.id === post.userId;
    post.canDelete = loggedInUser.id === post.userId;
    post.canPublish = loggedInUser.id === post.userId;
  }
  if (!post.userProfileIsPublic && loggedInUser.id !== post.userId) {
    delete post.profilePictureUrl;
    delete post.familyName;
    delete post.givenName;
  }
  delete post.userId;
  return post;
}
