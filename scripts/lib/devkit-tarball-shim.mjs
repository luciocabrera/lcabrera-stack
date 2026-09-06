/**
 * Running the packed `create-lcabrera-stack` initializer, and reading the tree
 * it left (verify-devkit-tarball.mjs).
 *
 * It runs in a scratch directory of its own, outside the scratch consumer:
 * that consumer is a git repository, and `create` refuses to nest one inside
 * another — which is the behaviour under test, not an obstacle to it.
 *
 * The deciding half is `createShimFindings` in `./devkit-tarball.mjs`.
 */

import { execFileSync } from 'node:child_process';
import { existsSync, mkdtempSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';

import { runGit } from '../../packages/repo-standards/scripts/git-exec.mjs';
import { createShimFindings, failureLine } from './devkit-tarball.mjs';

const NAME = 'create-lcabrera-stack';

const gitIn = (cwd, args) => runGit({ args, cwd }) ?? '';

const spawnFailure = ({ args, bin, cwd }) => {
  try {
    execFileSync(bin, args, {
      cwd,
      encoding: 'utf8',
      stdio: ['ignore', 'pipe', 'pipe'],
    });
    return [];
  } catch (error) {
    const output = `${error.stdout ?? ''}${error.stderr ?? ''}`.trim();
    const detail = output === '' ? error.message : failureLine(output);
    return [`\`${NAME} ${args.join(' ')}\` failed in the consumer: ${detail}`];
  }
};

/**
 * @param {string} consumer the scratch repository the tarballs were installed into
 * @returns {string[]}
 */
export const shimFindings = (consumer) => {
  const parent = mkdtempSync(join(tmpdir(), 'devkit-create-'));
  try {
    const failure = spawnFailure({
      args: ['made', '--profile', 'agent'],
      bin: join(consumer, 'node_modules', '.bin', NAME),
      cwd: parent,
    });
    const made = join(parent, 'made');
    return [
      ...failure,
      ...createShimFindings({
        commitSubject: gitIn(made, ['log', '-1', '--pretty=%s']),
        isRepository: existsSync(join(made, '.git')),
        status: gitIn(made, ['status', '--porcelain']),
        tracked: gitIn(made, ['ls-files']).split('\n'),
      }),
    ];
  } finally {
    rmSync(parent, { force: true, recursive: true });
  }
};
