const { exec } = require('child_process');

const cron = require('node-cron');

const bucketPrefix = `filbert-${process.env.NODE_ENV || 'dev'}-mysqlbackup`;
const hourlyBucketName = `${bucketPrefix}-hourly`;
const dailyBucketName = `${bucketPrefix}-daily`;
const adhocBucketName = `${bucketPrefix}-adhoc`;

const testHourly = './hourly';
const testDaily = './daily';

function cleanupBadFile(filenameAndPath) {
  exec(`rm ${filenameAndPath}`, (error, stdout, stderr) => {
    if (error) {
      console.error('rm failed mysqldump file error: ', error);
      return;
    }
    console.log('cleaned up failed mysqldump file: ', filenameAndPath);
    if (stdout) console.log(stdout);
    if (stderr) console.log(stderr);
  });
}

async function makeMysqlDump(now) {
  const currentBackupFilename = `${now.getFullYear()}-${(now.getMonth() + 1).toString().padStart(2, '0')}-${now.getDate().toString().padStart(2, '0')}_${now.getHours().toString().padStart(2, '0')}${now.getMinutes().toString().padStart(2, '0')}${now.getSeconds().toString().padStart(2, '0')}.sql`;
  const currentFileAndPath = `${testHourly}/${currentBackupFilename}`;
  try {
    const {stdout, stderr} = await new Promise(async (resolve, reject) => {
      exec(`docker exec $PERCONA_CONTAINER_NAME /usr/bin/mysqldump --hex-blob --default-character-set=utf8mb4 --databases filbert -uroot -p"$MYSQL_ROOT_PASSWORD" > ${currentFileAndPath}`, (error, stdout, stderr) => {
        if (error) {
          console.error(`mysqldump error: ${error}`);
          reject(error);
          return
        }
        resolve({stdout, stderr});
      })
    });
    if (stdout) console.log(stdout);
    // TODO: use mysql_editor_config to store obfuscated credentials in a .mylogin.cnf
    //  but, the percona docker doesn't create a /home/mysql dir, so need to investigate
    // https://dev.mysql.com/doc/refman/5.6/en/mysql-config-editor.html
    if (stderr && !stderr.includes('password')) console.error(stderr);
    return {filename: currentBackupFilename, path: testHourly};
  } catch (error) {
    cleanupBadFile(currentFileAndPath);
  }
}

async function lsDateDesc(path) {
  return new Promise((resolve, reject) => {
    exec(`ls -td $PWD/${path}/*`, (error, stdout, stderr) => {
      if (error) {
        reject(error);
        return;
      }
      if (stderr) console.error(stderr);
      resolve(stdout.trim().split('\n'));
    })
  })
}

async function copyFile(file, newPath) {
  return new Promise((resolve, reject) => {
    exec(`cp ${file} ${newPath}`, (error, stdout, stderr) => {
      if (error) {
        reject(error);
        return;
      }
      if (stderr) console.error(stderr);
      resolve(stdout);
    })
  })
}

async function deleteFiles(files) {
  return new Promise((resolve, reject) => {
    if (files.length === 0) {
      resolve();
    }
    exec(`rm ${files.join(' ')}`, (error, stdout, stderr) => {
      if (error) {
        reject(error);
        return;
      }
      if (stderr) console.error(stderr);
      resolve(stdout);
    })
  })
}

/**
 * runs once every hour at 0 minutes (add a * to the end (5 stars total) to test in seconds)
 *
 * keeps a backup per hour, and one a day
 */
cron.schedule('*/3 * * * * *', async () => {
  const numberOfHourlyBackupsToKeep = 24;
  const numberOfDailyBackupsToKeep = 14;
  const now = new Date();
  const hour = now.getSeconds()//now.getHours();
  console.log(`Attempting a mysqldump at ${now.toISOString()}`);
  // TODO: replace path with 'bucket'
  const { filename } = await makeMysqlDump(now);
  // TODO: replace files in path with files in 'bucket'
  const filesInHourly = await lsDateDesc(testHourly);
  if (filesInHourly.length < numberOfHourlyBackupsToKeep) {
    return;
  }
  if (hour === 0) {
    // promote the oldest file to the next level
    const promotedFile = filesInHourly[numberOfHourlyBackupsToKeep];
    console.log(`promoting ${promotedFile} to ${testDaily}`);
    await copyFile(promotedFile, testDaily);
    const filesInDaily = await lsDateDesc(testDaily);
    // keep a max window by deleting older backups
    const dailyBackupsToDelete = filesInDaily.slice(numberOfDailyBackupsToKeep)
    console.log(`daily: deleting ${dailyBackupsToDelete.length} files: `, dailyBackupsToDelete)
    await deleteFiles(dailyBackupsToDelete)
  }
  // keep a max window by deleting older backups
  const hourlyBackupsToDelete = filesInHourly.slice(numberOfHourlyBackupsToKeep)
  console.log(`hourly: deleting ${hourlyBackupsToDelete.length} files: `, hourlyBackupsToDelete)
  await deleteFiles(hourlyBackupsToDelete)
})