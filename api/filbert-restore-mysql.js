#!/usr/bin/env node
// ESM - remove after ECMAScript Module support is past Experimental node v14 ?
require = require('esm')(module /*, options*/);
const inquirer = require('inquirer');
const { textSync } = require('figlet');
const chalk = require('chalk');
const ora = require('ora');

const {
  error,
  info,
  warn,
  success,
  saneEnvironmentOrExit,
} = require('./lib/util');
const {
  listBuckets,
  listKeysForBucket,
  downloadFileFromBucket,
} = require('./lib/s3');
const { restoreMysqlFromFile } = require('./lib/mysql');
const { filbertMysqldumpToS3Adhoc } = require('./lib/mysqldump-adhoc');

async function main() {
  let spinner = new ora();
  try {
    info('\n', textSync('filbert MySQL restore'));
    warn('\n\nStarting the ✍️  filbert MySQL restore tool\n');
    spinner.start('Loading S3 buckets...\n');
    const { Buckets } = await listBuckets();
    spinner.succeed();
    const bucketNames = Buckets.map(({ Name }) => Name).filter((name) =>
      name.includes('mysql')
    );
    const { bucketName } = await inquirer.prompt([
      {
        name: 'bucketName',
        type: 'list',
        message: '♻️ Restore from which bucket?',
        choices: bucketNames,
      },
    ]);
    spinner.start(`Loading files for bucket ${bucketName}\n`);
    const fileNames = await listKeysForBucket(bucketName);
    spinner.succeed();
    const { backupFileName } = await inquirer.prompt([
      {
        name: 'backupFileName',
        type: 'list',
        message: `😲 OMG, ${bucketName} is actually my favorite bucket of all time! 🥳\nNow, tell me - which file should I restore from?`,
        choices: fileNames,
      },
    ]);
    success(backupFileName);
    const { shouldDumpBeforeRestore } = await inquirer.prompt([
      {
        name: 'shouldDumpBeforeRestore',
        type: 'confirm',
        message:
          'Excellent choice 👏 - Hey, want me to make a quick backup now before we try this?',
        default: true,
      },
    ]);
    success("You're the best.  Let's do a quick review of your selections.");
    warn(textSync('Review'));
    warn(
      '--------------------------------------------------------------------------'
    );
    const { pullTheTrigger } = await inquirer.prompt([
      {
        name: 'pullTheTrigger',
        type: 'confirm',
        message: `Restore MySQL from bucket ${chalk.greenBright.bold(
          bucketName
        )} file ${chalk.magentaBright.bold(
          backupFileName
        )} and make a backup beforehand ${
          shouldDumpBeforeRestore
            ? chalk.cyan.bold('Yes')
            : chalk.redBright.bold('No')
        }`,
        default: false,
      },
    ]);
    if (!pullTheTrigger) {
      error(textSync('Aborted'));
      process.exit(0);
    }
    if (shouldDumpBeforeRestore) {
      spinner.start('Making backup\n');
      await filbertMysqldumpToS3Adhoc();
      spinner.succeed();
    }
    spinner.start(
      `Downloading SQL file ${chalk.cyan(backupFileName)} from S3\n`
    );
    const tempFilenameAndPath = await downloadFileFromBucket(
      bucketName,
      backupFileName
    );
    spinner.succeed();
    spinner.start(`Restoring MySQL from ${chalk.cyan(backupFileName)}\n`);
    const { stderr } = await restoreMysqlFromFile(tempFilenameAndPath);
    if (stderr) {
      throw stderr;
    }
    spinner.succeed();
    success(textSync('Success, KTHXBYE'));
  } catch (err) {
    error(err);
    spinner.fail('error');
    process.exitCode = 1;
  }
}

saneEnvironmentOrExit([
  'MYSQL_ROOT_PASSWORD',
  'PERCONA_CONTAINER_NAME',
  'LINODE_OBJECT_STORAGE_ACCESS_KEY',
  'LINODE_OBJECT_STORAGE_SECRET_ACCESS_KEY',
]);

main();
