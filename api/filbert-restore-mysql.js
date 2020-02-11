#!/usr/bin/env node
// ESM - remove after ECMAScript Module support is past Experimental node v14 ?
require = require("esm")(module /*, options*/);
const inquirer = require("inquirer");
const {
  error,
  info,
  warn,
  success,
  saneEnvironmentOrExit
} = require("./lib/util");
const path = require("path");
const { fortune } = require("fortune-teller");
const { say: cowsay } = require("cowsay");
const { textSync } = require("figlet");
const chalk = require("chalk");
const ora = require("ora");
const termImg = require("term-img");

const { listBuckets, listKeysForBucket } = require("./lib/s3");
const { filbertMysqldumpToS3Adhoc } = require("./lib/mysqldump-adhoc");

async function main() {
  let spinner = new ora();
  try {
    termImg(path.join(__dirname, "quest-for-glory-ii-trial-by-fire_6.png"));
    info("\n", textSync("filbert MySQL restore"));
    warn("\n\nStarting the ✍️  filbert MySQL restore tool\n");
    success("$ fortune | cowsay ;");
    success(cowsay({ text: fortune(), e: "oO", T: "U " }), "\n\n");
    spinner.text = "Loading S3 buckets...";
    spinner.start();
    const { Buckets } = await listBuckets();
    spinner.succeed();
    const bucketNames = Buckets.map(({ Name }) => Name).filter(name =>
      name.includes("mysql")
    );
    const { bucketName } = await inquirer.prompt([
      {
        name: "bucketName",
        type: "list",
        message: "♻️ Restore from which bucket?",
        choices: bucketNames
      }
    ]);
    spinner.text = `Loading files for bucket ${bucketName}`;
    spinner.start();
    const fileNames = await listKeysForBucket(bucketName);
    spinner.succeed();
    const { backupFileName } = await inquirer.prompt([
      {
        name: "backupFileName",
        type: "list",
        message: `😲 OMG, ${bucketName} is actually my favorite bucket of all time! 🥳\nNow, tell me - which file should I restore from?`,
        choices: fileNames
      }
    ]);
    success(backupFileName);
    const { shouldDumpBeforeRestore } = await inquirer.prompt([
      {
        name: "shouldDumpBeforeRestore",
        type: "confirm",
        message:
          "Excellent choice 👏 - Hey, want me to make a quick backup now before we try this?",
        default: true
      }
    ]);
    success("You're the best.  Let's do a quick review of your selections.");
    warn(textSync("Review"));
    warn(
      "--------------------------------------------------------------------------"
    );
    const { pullTheTrigger } = await inquirer.prompt([
      {
        name: "pullTheTrigger",
        type: "confirm",
        message: `Restore MySQL from bucket ${chalk.greenBright.bold(
          bucketName
        )} file ${chalk.magentaBright.bold(
          backupFileName
        )} and make a backup beforehand ${
          shouldDumpBeforeRestore
            ? chalk.cyan.bold("Yes")
            : chalk.redBright.bold("No")
        }`,
        default: false
      }
    ]);
    if (!pullTheTrigger) {
      termImg(path.join(__dirname, "ejection-seat.jpg"));
      process.exit(0);
    }
    if (shouldDumpBeforeRestore) {
      spinner.text = "Making backup";
      spinner.start();
      await filbertMysqldumpToS3Adhoc();
      spinner.stop();
    }
    spinner.text = `Downloading SQL file ${chalk.cyan(backupFileName)} from S3`;
    spinner.start();
    //await downloadFile();
    spinner.stop();
    spinner.text = `Restoring MySQL from ${chalk.cyan(backupFileName)}`;
    spinner.start();
    // await restoreMysql();
    spinner.stop();
    await termImg(path.join(__dirname, "saurus.png"));
    success(
      cowsay({ text: textSync("Success, KTHXBYE"), n: true, f: "stegosaurus" })
    );

    // TODO: summarize selections here with a last (y/N) prompt
  } catch (err) {
    error(err);
    spinner.fail("error");
    process.exitCode = 1;
  }
}

saneEnvironmentOrExit([
  "MYSQL_ROOT_PASSWORD",
  "PERCONA_CONTAINER_NAME",
  "LINODE_OBJECT_STORAGE_ACCESS_KEY",
  "LINODE_OBJECT_STORAGE_SECRET_ACCESS_KEY"
]);

main();
