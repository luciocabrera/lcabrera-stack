/*
 * Running git for the one command that has to: `create`.
 *
 * Not a bare `execFileSync('git', …)`. That has the OS resolve the name through
 * the inherited PATH, where a writable directory earlier in the list shadows the
 * real binary. The fixed install locations are searched first and the executable
 * is always named outright, so the lookup never decides; PATH is then searched
 * explicitly rather than refusing, because this package is installed by
 * arbitrary repositories and `create` is its front door — a machine whose git
 * is under Nix, Homebrew or a Windows install would otherwise be told to install
 * the git it has. The child's PATH is pinned either way, so whatever git spawns
 * in turn is resolved from the directory git itself came from and the fixed
 * ones, never from the rest of the inherited list.
 *
 * The repository-selecting variables are scrubbed for a second reason: git
 * resolves `GIT_DIR` and its relatives ahead of `cwd`, so a run inheriting one
 * from a hook would set up a repository other than the one asked for.
 *
 * Written here rather than imported: `@lcabrera/repo-standards` holds the same
 * discipline for this repository's own tooling, and it is an OPTIONAL peer of
 * this package — depending on it for one helper would make every consumer who
 * wanted only the prose install the gates too (ADR-039 takes the duplicate over
 * the edge). `scripts/lib/git-exec-drift.test.mjs` asserts the two lists agree,
 * which is a check the repository owns and this package does not carry.
 *
 * The trusted directories, the scrubbed variables and the child environment
 * come from the `prepare` script the monorepo rung places, which has to carry
 * them itself because it runs where this package may not be installed.
 */

import { execFileSync } from 'node:child_process';
import { existsSync } from 'node:fs';
import { delimiter, join } from 'node:path';

import {
  gitEnvironment,
  TRUSTED_GIT_DIRECTORIES,
} from '../assets/workspace/scripts/hooks-path.mjs';

export {
  GIT_REPOSITORY_VARIABLES,
  gitEnvironment,
  TRUSTED_GIT_DIRECTORIES,
} from '../assets/workspace/scripts/hooks-path.mjs';

const IS_ON_WINDOWS = process.platform === 'win32';

const GIT_FILENAMES = IS_ON_WINDOWS ? ['git.exe', 'git'] : ['git'];

const gitUnder = (directory) =>
  GIT_FILENAMES.map((name) => join(directory, name)).find((path) =>
    existsSync(path),
  );

const firstGitIn = (directories) =>
  directories
    .map((value) => gitUnder(value))
    .find((path) => path !== undefined);

const pathDirectories = () =>
  (process.env.PATH ?? '').split(delimiter).filter((entry) => entry !== '');

/**
 * @param {{ directories: string[], pathEntries: string[] }} args
 * @returns {string | undefined} the first git under `directories`, else the
 * first under `pathEntries`; always an absolute path, never a bare name
 */
export const resolveGit = ({ directories, pathEntries }) =>
  firstGitIn(directories) ?? firstGitIn(pathEntries);

/** @returns {string | undefined} the git executable, named outright */
export const gitBinary = () =>
  resolveGit({
    directories: TRUSTED_GIT_DIRECTORIES,
    pathEntries: pathDirectories(),
  });

/**
 * @param {string | undefined} binary
 * @returns {string} the same path; throws rather than letting `undefined` reach
 * a spawn, where it reports as an argument-type error naming no cause
 */
export const requireGitBinary = (binary) => {
  if (binary === undefined) {
    throw new Error(
      `no git executable in ${TRUSTED_GIT_DIRECTORIES.join(', ')}, nor anywhere on PATH`,
    );
  }
  return binary;
};

const execute = ({ args, binary, cwd }) =>
  execFileSync(binary, args, {
    cwd,
    encoding: 'utf8',
    env: gitEnvironment({ binary, env: process.env }),
    stdio: ['ignore', 'pipe', 'pipe'],
  }).trim();

/**
 * @param {{ args: string[], cwd: string }} args
 * @returns {string} stdout, trimmed; throws when git fails
 */
export const runGit = ({ args, cwd }) =>
  execute({ args, binary: requireGitBinary(gitBinary()), cwd });

/**
 * A command that failed answers `''` — which is what an unset `git config` key
 * means. A missing git does not: it is resolved before the `try`, so "no git on
 * this machine" can never be read as "the key is unset".
 *
 * @param {{ args: string[], cwd: string }} args
 * @returns {string}
 */
export const readGit = ({ args, cwd }) => {
  const binary = requireGitBinary(gitBinary());
  try {
    return execute({ args, binary, cwd });
  } catch {
    return '';
  }
};
