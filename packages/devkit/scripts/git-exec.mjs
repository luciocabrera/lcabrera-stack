/*
 * Running git for the one command that has to: `create`.
 *
 * Not a bare `execFileSync('git', …)`. That has the OS resolve the name through
 * the inherited PATH, where a writable directory earlier in the list shadows the
 * real binary; naming the executable outright removes the lookup, and pinning
 * PATH for the child covers whatever git spawns in turn. The repository-selecting
 * variables are scrubbed for a second reason — git resolves `GIT_DIR` and its
 * relatives ahead of `cwd`, so a run inheriting one from a hook would set up a
 * repository other than the one asked for.
 *
 * Written here rather than imported: `@lcabrera/repo-standards` holds the same
 * discipline for this repository's own tooling, and it is an OPTIONAL peer of
 * this package — depending on it for one helper would make every consumer who
 * wanted only the prose install the gates too (ADR-039 takes the duplicate over
 * the edge). `scripts/lib/git-exec-drift.test.mjs` asserts the two lists agree,
 * which is a check the repository owns and this package does not carry.
 */

import { execFileSync } from 'node:child_process';
import { existsSync } from 'node:fs';

export const TRUSTED_GIT_DIRECTORIES = ['/usr/local/bin', '/usr/bin', '/bin'];

export const GIT_REPOSITORY_VARIABLES = new Set([
  'GIT_ALTERNATE_OBJECT_DIRECTORIES',
  'GIT_COMMON_DIR',
  'GIT_DIR',
  'GIT_INDEX_FILE',
  'GIT_NAMESPACE',
  'GIT_OBJECT_DIRECTORY',
  'GIT_WORK_TREE',
]);

/** @returns {string | undefined} the git executable, named outright */
export const gitBinary = () =>
  TRUSTED_GIT_DIRECTORIES.map((directory) => `${directory}/git`).find((path) =>
    existsSync(path),
  );

/**
 * @param {Record<string, string | undefined>} env
 * @returns {Record<string, string | undefined>}
 */
export const gitEnvironment = (env) =>
  Object.fromEntries([
    ...Object.entries(env).filter(
      ([name]) => !GIT_REPOSITORY_VARIABLES.has(name),
    ),
    ['PATH', TRUSTED_GIT_DIRECTORIES.join(':')],
  ]);

const execute = ({ args, cwd }) =>
  execFileSync(gitBinary(), args, {
    cwd,
    encoding: 'utf8',
    env: gitEnvironment(process.env),
    stdio: ['ignore', 'pipe', 'pipe'],
  }).trim();

/**
 * @param {{ args: string[], cwd: string }} args
 * @returns {string} stdout, trimmed; throws when git fails
 */
export const runGit = ({ args, cwd }) => execute({ args, cwd });

/**
 * @param {{ args: string[], cwd: string }} args
 * @returns {string} stdout, trimmed, or `''` for a command that failed — which
 * is what an unset `git config` key answers, not an error
 */
export const readGit = ({ args, cwd }) => {
  try {
    return execute({ args, cwd });
  } catch {
    return '';
  }
};
