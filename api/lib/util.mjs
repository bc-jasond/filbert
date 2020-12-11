import { success, error } from '@filbert/util';
import util from 'util';
import childProcess from 'child_process';

const { promisify } = util;
const { exec: execCb } = childProcess;
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
