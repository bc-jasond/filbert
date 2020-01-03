const { promisify } = require('util');
const {exec: execCb} = require('child_process');
const { performance } = require("perf_hooks");
const exec = promisify(execCb);

const cron = require('node-cron');

const {
  assertBucket,
  uploadFileToBucket,
  listKeysForBucket,
  copyKeyFromBucketToBucket,
  deleteKeysForBucket,
} = require('./s3');

const bucketPrefix = `filbert-${process.env.NODE_ENV || 'dev'}-mysqlbackups`;
const hourlyBucketName = `${bucketPrefix}-hourly`;
const dailyBucketName = `${bucketPrefix}-daily`;
const adhocBucketName = `filbert-mysql-backups`;

const stagingDirectory = `/tmp/filbert-mysql-backups`;

async function wrapExec(command) {
  try {
    const {stdout, stderr} = await exec(command);
    console.log(`exec() command succeeded: ${command}`)
    if (stdout) console.log(stdout);
    // TODO: use mysql_editor_config to store obfuscated credentials in a .mylogin.cnf
    //  but, the percona docker doesn't create a /home/mysql dir, so need to investigate
    // https://dev.mysql.com/doc/refman/5.6/en/mysql-config-editor.html
    if (stderr && !stderr.includes('password')) console.error(stderr);
    return stdout || true;
  }
  catch(err) {
    console.error(`exec() command failed: ${command}`)
  }
}

async function assertDir(dirname) {
  return wrapExec(`mkdir -p ${dirname}`);
}

async function rmFile(filenameAndPath) {
  return wrapExec(`rm ${filenameAndPath}`);
}

async function makeMysqlDump(now) {
  const currentBackupFilename = `${now.getFullYear()}-${(now.getMonth() + 1).toString().padStart(2, '0')}-${now.getDate().toString().padStart(2, '0')}_${now.getHours().toString().padStart(2, '0')}${now.getMinutes().toString().padStart(2, '0')}${now.getSeconds().toString().padStart(2, '0')}.sql`;
  const currentFileAndPath = `${stagingDirectory}/${currentBackupFilename}`;
  try {
    const stdout = await wrapExec(`docker exec $PERCONA_CONTAINER_NAME /usr/bin/mysqldump --hex-blob --default-character-set=utf8mb4 --databases filbert -uroot -p"$MYSQL_ROOT_PASSWORD" > ${currentFileAndPath}`);
    if (typeof stdout === 'string') console.log(stdout);
    return {filenameWithAbsolutePath: currentFileAndPath};
  } catch (error) {
    return rmFile(currentFileAndPath);
  }
}

/**
 * runs once every hour at 0 minutes (add a * to the end (5 stars total) to test in seconds)
 *
 * keeps a backup per hour, and one a day
 */
let isRunning = false;

async function filbertMysqldumpToS3Job() {
  if (isRunning) {
    console.error("I'm already running!");
    return;
  }
  try {
    isRunning = true;
    const startTime = performance.now();
    console.log('starting filbertMysqldumpToS3Job()');
    
    const numberOfHourlyBackupsToKeep = 24;
    const numberOfDailyBackupsToKeep = 14;
    const now = new Date();
    const hour = now.getHours();
    // make sure the temp dir exists
    await assertDir(stagingDirectory);
    // make sure the buckets exist...
    await assertBucket(hourlyBucketName);
    await assertBucket(dailyBucketName);
    
    console.log(`Attempting a mysqldump at ${now.toISOString()}`);
    // TODO: replace path with 'bucket'
    const { filenameWithAbsolutePath } = await makeMysqlDump(now);
    await uploadFileToBucket(hourlyBucketName, filenameWithAbsolutePath);
    console.log(`Uploaded ${filenameWithAbsolutePath} to ${hourlyBucketName} 👍`);
    await rmFile(filenameWithAbsolutePath);
    // TODO: replace files in path with files in 'bucket'
    const filesInHourly = await listKeysForBucket(hourlyBucketName)
    if (filesInHourly.length < numberOfHourlyBackupsToKeep) {
      console.log(
        `finished filbertMysqldumpToS3Job(). Took ${Math.round(performance.now() - startTime) /
        1000} seconds.\n`
      );
      isRunning = false;
      return;
    }
    if (hour === 0) {
      // promote the oldest file to the next level
      const promotedFile = filesInHourly[numberOfHourlyBackupsToKeep];
      await copyKeyFromBucketToBucket(hourlyBucketName, dailyBucketName, promotedFile);
      console.log(`Promoted ${promotedFile} from ${hourlyBucketName} to ${dailyBucketName} 👍`);
      const filesInDaily = await listKeysForBucket(dailyBucketName)
      // keep a max window by deleting older backups
      const dailyBackupsToDelete = filesInDaily.slice(numberOfDailyBackupsToKeep)
      if (dailyBackupsToDelete.length > 0) {
        console.log(`daily: deleting ${dailyBackupsToDelete.length} files:\n${dailyBackupsToDelete.join('\n')}`);
        await deleteKeysForBucket(dailyBucketName, dailyBackupsToDelete);
      }
    }
    // keep a max window by deleting older backups
    const hourlyBackupsToDelete = filesInHourly.slice(numberOfHourlyBackupsToKeep)
    if (hourlyBackupsToDelete.length > 0) {
      console.log(`hourly: deleting ${hourlyBackupsToDelete.length} files:\n${hourlyBackupsToDelete.join('\n')}`);
      await deleteKeysForBucket(hourlyBucketName, hourlyBackupsToDelete)
    }
    console.log(
      `finished filbertMysqldumpToS3Job(). Took ${Math.round(performance.now() - startTime) /
      1000} seconds.\n`
    );
    isRunning = false;
  } catch (err) {
    console.error('filbert cron error: ', err);
    isRunning = false;
  }
}

console.log('Starting filbert-cron scheduler...');
const { env } = process;
const missingEnvVariables = ['MYSQL_ROOT_PASSWORD','PERCONA_CONTAINER_NAME','LINODE_OBJECT_STORAGE_ACCESS_KEY','LINODE_OBJECT_STORAGE_SECRET_ACCESS_KEY']
  .filter(key => !env[key] && key);
if (missingEnvVariables.length > 0) {
  console.error(`process.env not sane!\n\nThe following variables are missing:\n${missingEnvVariables.join('\n')}`);
  process.exit(1);
}
//filbertMysqldumpToS3Job();
// run once an hour at 0 minutes i.e. 1:00, 2:00, 11:00...
cron.schedule('0 * * * *', filbertMysqldumpToS3Job);
