/**
 * The tree a false-positive panel reads: the files of the case's commit,
 * exported with `git archive`, so the directory has no `.git` and no history,
 * commit message or branch to reach. The coordination claims are removed too,
 * and the flagged lines must hash as the case recorded them.
 */
import { execFileSync } from 'node:child_process';
import {
  existsSync,
  mkdirSync,
  mkdtempSync,
  readFileSync,
  rmSync,
  writeFileSync,
} from 'node:fs';
import { tmpdir } from 'node:os';
import { dirname, join } from 'node:path';
import process from 'node:process';

import {
  buildGitEnv,
  runGitStatus,
} from '../../packages/repo-standards/scripts/git-exec.mjs';
import { hashLines } from './false-positive-markers.mjs';
import { repoPath } from './tool-paths.mjs';

export const SYSTEM_DIRECTORIES = ['/usr/local/bin', '/usr/bin', '/bin'];

const COMMIT = /^[0-9a-f]{40}$/u;

export const STRIPPED_FROM_EXPORT = [
  'docs/coordination/tasks',
  'docs/coordination/branches',
];

export const systemBinary = (name) => {
  const found = SYSTEM_DIRECTORIES.map((directory) =>
    join(directory, name),
  ).find((path) => existsSync(path));
  if (found === undefined) {
    throw new Error(`no ${name} in ${SYSTEM_DIRECTORIES.join(', ')}`);
  }
  return found;
};

const extract = ({ into, root, sha }) => {
  const archive = join(into, 'tree.tar');
  const archived = runGitStatus({
    args: ['archive', '--format=tar', `--output=${archive}`, sha],
    cwd: root,
  });
  if (archived.status !== 0) {
    throw new Error(`git archive ${sha} failed: ${archived.stderr}`);
  }
  execFileSync(systemBinary('tar'), [`--file=${archive}`, '--extract'], {
    cwd: into,
    env: buildGitEnv(process.env),
  });
  rmSync(archive);
};

const assertFlaggedLines = ({ caseFile, into }) => {
  const text = readFileSync(
    repoPath({ path: caseFile.case.file, root: into }),
    'utf8',
  );
  const lines = text
    .split('\n')
    .slice(caseFile.code.start - 1, caseFile.code.end);
  if (hashLines(lines) !== caseFile.case.content_hash) {
    throw new Error(
      `${caseFile.case.file} at ${caseFile.case.head_sha} does not hold the flagged lines; commit them and open the case again`,
    );
  }
};

export const exportCaseTree = ({ caseFile, casePath, root }) => {
  const sha = caseFile.case.head_sha;
  if (!COMMIT.test(sha)) throw new Error(`"${sha}" is not a commit sha`);
  const into = mkdtempSync(join(tmpdir(), 'fp-panel-'));
  try {
    extract({ into, root, sha });
    for (const path of STRIPPED_FROM_EXPORT) {
      rmSync(repoPath({ path, root: into }), { force: true, recursive: true });
    }
    assertFlaggedLines({ caseFile, into });
    const target = repoPath({ path: casePath, root: into });
    mkdirSync(dirname(target), { recursive: true });
    writeFileSync(target, `${JSON.stringify(caseFile, null, 2)}\n`);
    return into;
  } catch (error) {
    rmSync(into, { force: true, recursive: true });
    throw error;
  }
};
