// ESM - remove after ECMAScript Module support is past Experimental node v14 ?
require = require('esm')(module /*, options*/);

const { performance } = require('perf_hooks');
const cron = require('node-cron');

const { saneEnvironmentOrExit } = require('@filbert/util')
const {
  assertBucket,
  uploadFileToBucket,
  listKeysForBucket,
  copyKeyFromBucketToBucket,
  deleteKeysForBucket,
} = require('./lib/s3');
const { makeMysqlDump } = require('./lib/mysql');
const {
  fileUploadStagingDirectory,
  monthlyBucketName,
  dailyBucketName,
  hourlyBucketName,
} = require('./lib/constants');
const { assertDir, rmFile } = require('./lib/util');

/**
 * runs once every hour at 0 minutes (add a * to the end (5 stars total) to test in seconds)
 *
 * keeps a backup per hour, and one a day
 */

async function filbertMysqldumpToS3Job() {
  try {
    const startTime = performance.now();
    console.log('starting filbertMysqldumpToS3Job()');

    const numberOfHourlyBackupsToKeep = 24;
    const numberOfDailyBackupsToKeep = 30;
    const now = new Date();
    const hour = now.getHours();
    const date = now.getDate();
    // make sure the temp dir exists
    await assertDir(fileUploadStagingDirectory);
    // make sure the buckets exist...
    await assertBucket(hourlyBucketName);
    await assertBucket(dailyBucketName);
    await assertBucket(monthlyBucketName);

    console.log(`Attempting a mysqldump at ${now.toISOString()}`);
    // TODO: gzip the output?
    const { filenameWithAbsolutePath } = await makeMysqlDump(
      now,
      fileUploadStagingDirectory
    );
    await uploadFileToBucket(hourlyBucketName, filenameWithAbsolutePath);
    console.log(
      `Uploaded ${filenameWithAbsolutePath} to ${hourlyBucketName} 👍`
    );
    // delete the /tmp/ file
    await rmFile(filenameWithAbsolutePath);
    const filesInHourly = await listKeysForBucket(hourlyBucketName);
    // just keep X backups at most, doesn't do any checking of dates
    // assumes the files are named by when they were created
    if (filesInHourly.length < numberOfHourlyBackupsToKeep) {
      console.log(
        `finished filbertMysqldumpToS3Job(). Took ${
          Math.round(performance.now() - startTime) / 1000
        } seconds.\n`
      );
      return;
    }
    if (hour === 0) {
      // promote the oldest file to the next level
      const promotedFileHourlyToDaily =
        filesInHourly[
          Math.min(filesInHourly.length - 1, numberOfHourlyBackupsToKeep)
        ];
      await copyKeyFromBucketToBucket(
        hourlyBucketName,
        dailyBucketName,
        promotedFileHourlyToDaily
      );
      console.log(
        `⬆️ Promoted ${promotedFileHourlyToDaily} from ${hourlyBucketName} to ${dailyBucketName} 👍`
      );
      const filesInDaily = await listKeysForBucket(dailyBucketName);
      if (date === 1) {
        // promote the oldest daily file to monthly
        const promotedFileDailyToMonthly =
          filesInDaily[
            Math.min(filesInDaily.length - 1, numberOfDailyBackupsToKeep)
          ];
        await copyKeyFromBucketToBucket(
          dailyBucketName,
          monthlyBucketName,
          promotedFileDailyToMonthly
        );
        console.log(
          `📅 ⬆️ Promoted ${promotedFileDailyToMonthly} from ${dailyBucketName} to ${monthlyBucketName} 👍`
        );
      }
      // keep a max window by deleting older backups
      const dailyBackupsToDelete = filesInDaily.slice(
        numberOfDailyBackupsToKeep
      );
      if (dailyBackupsToDelete.length > 0) {
        console.log(
          `daily: deleting ${
            dailyBackupsToDelete.length
          } files:\n${dailyBackupsToDelete.join('\n')}`
        );
        await deleteKeysForBucket(dailyBucketName, dailyBackupsToDelete);
      }
    }
    // keep a max window by deleting older backups
    const hourlyBackupsToDelete = filesInHourly.slice(
      numberOfHourlyBackupsToKeep
    );
    if (hourlyBackupsToDelete.length > 0) {
      console.log(
        `hourly: deleting ${
          hourlyBackupsToDelete.length
        } files:\n${hourlyBackupsToDelete.join('\n')}`
      );
      await deleteKeysForBucket(hourlyBucketName, hourlyBackupsToDelete);
    }
    console.log(
      `finished filbertMysqldumpToS3Job(). Took ${
        Math.round(performance.now() - startTime) / 1000
      } seconds.\n`
    );
  } catch (err) {
    console.error('filbert cron error: ', err);
  }
}

console.log('Starting filbert-cron scheduler...');
saneEnvironmentOrExit(
  'MYSQL_ROOT_PASSWORD',
  'PERCONA_CONTAINER_NAME',
  'LINODE_OBJECT_STORAGE_ACCESS_KEY',
  'LINODE_OBJECT_STORAGE_SECRET_ACCESS_KEY',
);

//filbertMysqldumpToS3Job();
// run once an hour at 5 minutes i.e. 1:05, 2:05, 11:05...
cron.schedule('5 * * * *', filbertMysqldumpToS3Job);
