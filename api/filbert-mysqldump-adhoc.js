// ESM - remove after ECMAScript Module support is past Experimental node v14 ?
require = require("esm")(module /*, options*/);

const { performance } = require("perf_hooks");
const { assertBucket, uploadFileToBucket } = require("./s3");
const {
  assertDir,
  stagingDirectory,
  makeMysqlDump,
  rmFile
} = require("./mysql");

const adhocBucketName = `filbert-mysql-backups`;

async function filbertMysqldumpToS3Adhoc() {
  try {
    const startTime = performance.now();
    console.log("starting filbertMysqldumpToS3Adhoc()");

    const now = new Date();
    // make sure the temp dir exists
    await assertDir(stagingDirectory);
    // make sure the buckets exist...
    await assertBucket(adhocBucketName);

    console.log(`Attempting a mysqldump at ${now.toISOString()}`);
    // TODO: gzip the output?
    const { filenameWithAbsolutePath } = await makeMysqlDump(now);
    await uploadFileToBucket(adhocBucketName, filenameWithAbsolutePath);
    console.log(
      `Uploaded ${filenameWithAbsolutePath} to ${adhocBucketName} 👍`
    );
    // delete the /tmp/ file
    await rmFile(filenameWithAbsolutePath);
    console.log(
      `finished filbertMysqldumpToS3Adhoc(). Took ${Math.round(
        performance.now() - startTime
      ) / 1000} seconds.\n`
    );
  } catch (err) {
    console.error("filbertMysqldumpToS3Adhoc() Error: ", err);
    process.exitCode = 1;
  }
}
filbertMysqldumpToS3Adhoc();
