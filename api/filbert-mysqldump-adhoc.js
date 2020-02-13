// ESM - remove after ECMAScript Module support is past Experimental node v14 ?
require = require("esm")(module /*, options*/);

const { filbertMysqldumpToS3Adhoc } = require("./lib/mysqldump-adhoc");

filbertMysqldumpToS3Adhoc();
