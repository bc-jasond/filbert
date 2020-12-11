import { performance } from 'perf_hooks';
import { assertBucket, uploadFileToBucket } from './s3';
import { makeMysqlDump } from './mysql.mjs';
import { assertDir, rmFile } from './util.mjs';
import { fileUploadStagingDirectory, adhocBucketName } from './constants.mjs';

export async function filbertMysqldumpToS3Adhoc() {
  try {
    const startTime = performance.now();
    console.log('starting filbertMysqldumpToS3Adhoc()');

    const now = new Date();
    // make sure the temp dir exists
    await assertDir(fileUploadStagingDirectory);
    // make sure the buckets exist...
    await assertBucket(adhocBucketName);

    console.log(`Attempting a mysqldump at ${now.toISOString()}`);
    // TODO: gzip the output?
    const { filenameWithAbsolutePath } = await makeMysqlDump(
      now,
      fileUploadStagingDirectory
    );
    await uploadFileToBucket(adhocBucketName, filenameWithAbsolutePath);
    console.log(
      `Uploaded ${filenameWithAbsolutePath} to ${adhocBucketName} 👍`
    );
    // delete the /tmp/ file
    await rmFile(filenameWithAbsolutePath);
    console.log(
      `finished filbertMysqldumpToS3Adhoc(). Took ${
        Math.round(performance.now() - startTime) / 1000
      } seconds.\n`
    );
  } catch (err) {
    console.error('filbertMysqldumpToS3Adhoc() Error: ', err);
    throw err;
  }
}
