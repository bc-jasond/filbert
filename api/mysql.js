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

module.exports.getKnex = async function getKnex() {
  return knex({
    client: 'mysql2',
    connection: {
      host : 'localhost',
      user : 'root',
      password: 'example',
      database: 'dubaniewicz'
    },
    asyncStackTraces: true,
    debug: true,
  });
}