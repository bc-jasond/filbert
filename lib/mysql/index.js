module.exports = {
  mysqlConnectionConfig: {
    host: process.env.NODE_ENV === 'production' ? 'db' : 'localhost', // docker-compose.yml service name
    port: 3306,
    user: 'root',
    password: process.env.MYSQL_ROOT_PASSWORD,
    database: 'filbert',
  },
};
