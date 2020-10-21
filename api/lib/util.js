const { success, error } = require('@filbert/util');
const { promisify } = require('util');
const { exec: execCb } = require('child_process');
const exec = promisify(execCb);

export async function wrapExec(command) {
  try {
    const { stdout, stderr } = await exec(command);
    success(`exec() command succeeded: ${command}`, stdout);
    if (stdout) success(stdout);
    if (stderr) error(stderr);
    return { stdout, stderr };
  } catch (err) {
    error(`exec() command failed: ${command}`, err);
    return { stderr: err };
  }
}

export async function assertDir(dirname) {
  return wrapExec(`mkdir -p ${dirname}`);
}

export async function rmFile(filenameAndPath) {
  return wrapExec(`rm ${filenameAndPath}`);
}

export function getFirstNode(nodesById, postId) {
  //info("getFirstNode()", JSON.stringify(nodesById, null, 4));
  const idSeen = new Set();
  const nextSeen = new Set();
  for (const nodeId in nodesById) {
    const node = nodesById[nodeId];
    idSeen.add(node.id);
    if (node.next_sibling_id) {
      nextSeen.add(node.next_sibling_id);
    }
  }
  const difference = new Set([...idSeen].filter((id) => !nextSeen.has(id)));
  if (difference.size !== 1) {
    error(
      "DocumentError getFirstNode() - more than one node isn't pointed to by another node!",
      postId,
      JSON.stringify(difference, null, 2),
      JSON.stringify(idSeen, null, 2)
    );
  }
  const [firstId] = [...difference];
  return nodesById[firstId];
}
