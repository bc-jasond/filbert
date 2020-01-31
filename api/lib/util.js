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
    console.error(
      "DocumentError.getFirstNode() - more than one node isn't pointed to by another node!",
      difference
    );
  }
  const [firstId] = [...difference];
  return nodesById[firstId];
}

module.exports = {
  saneEnvironmentOrExit,
  wrapExec,
  assertDir,
  rmFile,
  getFirstNode
};
