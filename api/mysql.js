// const mysql = require('mysql2/promise')
const knex = require('knex')

// module.exports = {
//   getConnection: async () => {
//     const connectionPromise = await mysql.createConnection({
//       host: 'localhost',
//       user: 'root',
//       password: 'example',
//       database: 'dubaniewicz'
//     });
//
//     const {
//       // mysql2 'connection' is a wrapper of the node-mysql 'connection', used here for basic monitoring info
//       connection: {
//         threadId,
//         _handshakePacket: {
//           serverVersion
//         }
//       }
//     } = connectionPromise;
//     console.log(`MySQL version ${serverVersion} connected as ${threadId}`, );
//
//     return connectionPromise;
//   }
// }

async function getKnex() {
  return knex({
    client: 'mysql2',
    connection: {
      host: 'localhost',
      user: 'root',
      password: 'example',
      database: 'dubaniewicz'
    },
    asyncStackTraces: true,
    debug: true,
  });
}

async function bulkContentNodeUpsert(records) {
  const knexInstance = await getKnex();
  const query = `
    INSERT INTO content_node (post_id, id, parent_id, position, type, content, meta) VALUES
    ${records.map(() => '(?)').join(',')}
    ON DUPLICATE KEY UPDATE
    parent_id = VALUES(parent_id),
    position = VALUES(position),
    content = VALUES(content),
    meta = VALUES(meta)`;
  
  const values = [];
  
  records.forEach(record => {
    values.push([
      record.post_id,
      record.id,
      record.parent_id,
      record.position,
      record.type,
      record.content,
      JSON.stringify(record.meta),
    ]);
  });
  
  return knexInstance.raw(query, values);
}

module.exports.getKnex = getKnex;
module.exports.bulkContentNodeUpsert = bulkContentNodeUpsert;