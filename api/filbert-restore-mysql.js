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
const { listBuckets, listKeysForBucket } = require("./lib/s3");

async function main() {
  const { Buckets } = await listBuckets();
  const bucketNames = Buckets.map(({ Name }) => Name).filter(name =>
    name.includes("mysql")
  );
  const { bucketName } = await inquirer.prompt([
    {
      name: "bucketName",
      type: "list",
      message: "Restore from which bucket?",
      choices: bucketNames
    }
  ]);
  success(bucketName);
  const fileNames = await listKeysForBucket(bucketName);
  const { backupFileName } = await inquirer.prompt([
    {
      name: "backupFileName",
      type: "list",
      message: `OMG, ${bucketName} is actually my favorite bucket of all time!\nNow, tell me - which file should I restore from?`,
      choices: fileNames
    }
  ]);
  success(backupFileName);
  const { shouldDumpBeforeRestore } = await inquirer.prompt([
    {
      name: "shouldDumpBeforeRestore",
      type: "confirm",
      message:
        "For sure - Hey, want me to make a quick backup now before we try this?",
      default: true
    }
  ]);
  success(shouldDumpBeforeRestore, "KTHXBYE");

  // TODO: summarize selections here with a last (y/N) prompt
  // TODO: add ora loaders
}

warn("Starting filbert MySQL restore tool");
warn("TODO: put a figlet, cowsay, fortune & terminal-image HERE");
saneEnvironmentOrExit([
  "MYSQL_ROOT_PASSWORD",
  "PERCONA_CONTAINER_NAME",
  "LINODE_OBJECT_STORAGE_ACCESS_KEY",
  "LINODE_OBJECT_STORAGE_SECRET_ACCESS_KEY"
]);

main();
