export const mysqlConnectionConfig = {
  host: process.env.NODE_ENV === 'production' ? 'db' : 'localhost', // docker-compose.yml service name
  port: 3306,
  user: 'root',
  password: process.env.MYSQL_ROOT_PASSWORD,
  database: 'filbert',
};

export function getMysqlDatetime(date = null) {
  if (date && !(date instanceof Date)) {
    throw new Error(`getMysqlDatetime: ${date} isn't a built-in JS Date()`);
  }
  const dateInstance = date || new Date();
  // dirty! https://stackoverflow.com/a/15103764/1991322
  return (
    dateInstance.getFullYear() +
    '-' +
    ('0' + (dateInstance.getMonth() + 1)).slice(-2) +
    '-' +
    ('0' + dateInstance.getDate()).slice(-2) +
    ' ' +
    ('0' + dateInstance.getHours()).slice(-2) +
    ':' +
    ('0' + dateInstance.getMinutes()).slice(-2) +
    ':' +
    ('0' + dateInstance.getSeconds()).slice(-2)
  );
}
