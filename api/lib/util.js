const { promisify } = require("util");
const { exec: execCb } = require("child_process");
const exec = promisify(execCb);

const chalk = require("chalk");

function saneEnvironmentOrExit(requiredVars) {
  const { env } = process;
  const missingEnvVariables = requiredVars.filter(key => !env[key] && key);
  if (missingEnvVariables.length > 0) {
    console.error(
      chalk.red(
        `❌ process.env not sane!\n\nThe following variables are missing:\n${missingEnvVariables.join(
          "\n"
        )}`
      )
    );
    process.exit(1);
  }
}

async function wrapExec(command) {
  try {
    const { stdout, stderr } = await exec(command);
    console.log(`exec() command succeeded: ${command}`, stdout);
    if (stdout) console.log(stdout);
    if (stderr) console.error(stderr);
    return { stdout, stderr };
  } catch (err) {
    console.error(`exec() command failed: ${command}`, err);
  }
}

async function assertDir(dirname) {
  return wrapExec(`mkdir -p ${dirname}`);
}

async function rmFile(filenameAndPath) {
  return wrapExec(`rm ${filenameAndPath}`);
}

module.exports = {
  saneEnvironmentOrExit,
  wrapExec,
  assertDir,
  rmFile
};
