#!/usr/bin/env node

/**
 * Runs each workspace's own ESLint flat config over the files handed to it,
 * fixing what ESLint can fix.
 *
 * Without this the ESLint pass first runs after a commit exists — in a pre-push
 * gate or in CI — so a finding that would have fixed itself costs a round trip.
 * A staged-files runner can hand this the whole changeset: paths ESLint does not
 * lint, and paths outside every workspace, are dropped rather than guessed at.
 *
 * Usage:
 *   repo-eslint-staged <file>…
 *   repo-eslint-staged --check <file>…
 *   repo-eslint-staged [--check] -- <file>…   (names starting with `-`)
 *
 * Exit codes: 0 = clean, 1 = findings remain, 2 = nothing to lint or a bad
 * option.
 */
import { spawnSync } from 'node:child_process';
import { existsSync } from 'node:fs';
import { dirname, join, relative, resolve } from 'node:path';
import process from 'node:process';
import { fileURLToPath } from 'node:url';

import {
  eslintArguments,
  parseArguments,
  planLintGroups,
} from './eslint-staged.mjs';
import { resolveHostRoot } from './host-root.mjs';

const REPO_ROOT = resolveHostRoot({
  moduleDirectory: dirname(fileURLToPath(import.meta.url)),
});

const eslintBinary = (directory) => {
  const local = join(directory, 'node_modules', '.bin', 'eslint');
  return existsSync(local)
    ? local
    : join(REPO_ROOT, 'node_modules', '.bin', 'eslint');
};

const runGroup = ({ directory, files, fix }) => {
  const { error, status } = spawnSync(
    eslintBinary(directory),
    eslintArguments({ files, fix }),
    { cwd: directory, stdio: 'inherit' },
  );
  if (status === null) {
    console.error(
      `\nESLint could not be run in ${relative(REPO_ROOT, directory)}: ` +
        `${error?.message ?? 'the process was terminated by a signal'}\n`,
    );
  }
  return status === 0;
};

const reportFailures = (failed) => {
  const listed = failed
    .map(({ directory }) => `  • ${relative(REPO_ROOT, directory)}`)
    .join('\n');
  console.error(
    `\nESLint findings remain in ${failed.length} workspace(s):\n${listed}\n`,
  );
};

const usage = (message) => {
  console.error(message);
  console.error('usage: repo-eslint-staged [--check] [--] <file>…');
  process.exitCode = 2;
};

const main = () => {
  const { check, paths, unknown } = parseArguments(process.argv.slice(2));

  if (unknown.length > 0) {
    usage(
      `repo-eslint-staged: unknown option ${unknown.join(', ')}. ` +
        'A file whose name starts with "-" goes after "--".',
    );
    return;
  }

  if (paths.length === 0) {
    usage('repo-eslint-staged: no files given.');
    return;
  }

  const groups = planLintGroups({
    paths: paths
      .map((arg) => resolve(REPO_ROOT, arg))
      .filter((path) => existsSync(path)),
    repoRoot: REPO_ROOT,
  });
  const failed = groups.filter((group) => !runGroup({ ...group, fix: !check }));

  if (failed.length > 0) {
    reportFailures(failed);
    process.exitCode = 1;
  }
};

main();
