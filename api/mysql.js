const knex = require('knex')

let knexConnection;

async function getKnex() {
  if (!knexConnection) {
    knexConnection = knex({
      client: 'mysql2',
      connection: {
        host: process.env.DATABASE_HOSTNAME,
        user: 'root',
        password: process.env.MYSQL_ROOT_PASSWORD,
        database: 'dubaniewicz'
      },
      asyncStackTraces: true,
      debug: true,
    });
  }
  return knexConnection;
}

async function bulkContentNodeUpsert(records) {
  if (records.length === 0) return;
  const knexInstance = await getKnex();
  const query = `
    INSERT INTO content_node (post_id, id, parent_id, position, type, content, meta) VALUES
    ${records.map(() => '(?)').join(',')}
    ON DUPLICATE KEY UPDATE
    parent_id = VALUES(parent_id),
    position = VALUES(position),
    type = VALUES(type),
    content = VALUES(content),
    meta = VALUES(meta)`;
  
  const values = [];
  
  records.forEach(([nodeId, update]) => {
    const { post_id, node } = update;
    values.push([
      post_id,
      nodeId,
      node.parent_id !== 'null' ? node.parent_id : null,
      node.position,
      node.type,
      node.content || '',
      JSON.stringify(node.meta || {}),
    ]);
  });
  
  return knexInstance.raw(query, values);
}

async function bulkContentNodeDelete(records) {
  // delete all records WHERE id IN (...recordIds) OR WHERE parent_id IN (...recordIds)
  if (records.length === 0) return;
  const postId = records[0][1].post_id;
  const recordIds = records.map(r => r[0]);
  const knexInstance = await getKnex();
  return knexInstance('content_node')
    .where('post_id', postId)
    .andWhere(builder => builder
      .whereIn('id', recordIds)
      .orWhereIn('parent_id', recordIds)
    )
    .del();
}

module.exports.getKnex = getKnex;
module.exports.bulkContentNodeUpsert = bulkContentNodeUpsert;
module.exports.bulkContentNodeDelete = bulkContentNodeDelete;