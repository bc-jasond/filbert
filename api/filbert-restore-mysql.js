// ESM - remove after ECMAScript Module support is past Experimental node v14 ?
require = require("esm")(module /*, options*/);
const {
  error,
  info,
  warn,
  success,
  saneEnvironmentOrExit
} = require("./lib/util");

async function main() {}

info("Starting filbert- scheduler...");
saneEnvironmentOrExit([
  "MYSQL_ROOT_PASSWORD",
  "PERCONA_CONTAINER_NAME",
  "LINODE_OBJECT_STORAGE_ACCESS_KEY",
  "LINODE_OBJECT_STORAGE_SECRET_ACCESS_KEY"
]);

main();
