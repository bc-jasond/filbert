const { promisify } = require("util");
const { exec: execCb } = require("child_process");
const exec = promisify(execCb);

const chalk = require("chalk");

const error = (...args) => console.error(chalk.red(...args));
const warn = (...args) => console.warn(chalk.yellow(...args));
const info = (...args) => console.info(chalk.blue(...args));
const success = (...args) => console.log(chalk.green(...args));

function saneEnvironmentOrExit(requiredVars) {
  const { env } = process;
  const missingEnvVariables = requiredVars.filter(key => !env[key] && key);
  if (missingEnvVariables.length > 0) {
    error(
      `❌ process.env not sane!\n\nThe following variables are missing:\n${missingEnvVariables.join(
        "\n"
      )}`
    );
    process.exit(1);
  }
}

async function wrapExec(command) {
  try {
    const { stdout, stderr } = await exec(command);
    success(`exec() command succeeded: ${command}`, stdout);
    if (stdout) success(stdout);
    if (stderr) error(stderr);
    return { stdout, stderr };
  } catch (err) {
    error(`exec() command failed: ${command}`, err);
  }
}

async function assertDir(dirname) {
  return wrapExec(`mkdir -p ${dirname}`);
}

async function rmFile(filenameAndPath) {
  return wrapExec(`rm ${filenameAndPath}`);
}

function getFirstNode(nodesById) {
  const idSeen = new Set();
  const nextSeen = new Set();
  for (const nodeId in nodesById) {
    const node = nodesById[nodeId];
    idSeen.add(node.id);
    if (node.next_sibling_id) {
      nextSeen.add(node.next_sibling_id);
    }
  }
  const difference = new Set([...idSeen].filter(id => !nextSeen.has(id)));
  if (difference.size !== 1) {
    error(
      "DocumentError.getFirstNode() - more than one node isn't pointed to by another node!",
      difference
    );
  }
  const [firstId] = [...difference];
  return nodesById[firstId];
}

module.exports = {
  error,
  warn,
  info,
  success,
  saneEnvironmentOrExit,
  wrapExec,
  assertDir,
  rmFile,
  getFirstNode
};
