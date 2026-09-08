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
 *
 * Exit codes: 0 = clean, 1 = findings remain, 2 = no files given.
 */
import { spawnSync } from 'node:child_process';
import { existsSync } from 'node:fs';
import { dirname, join, relative, resolve } from 'node:path';
import process from 'node:process';
import { fileURLToPath } from 'node:url';

import { eslintArguments, planLintGroups } from './eslint-staged.mjs';
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

const main = () => {
  const args = process.argv.slice(2);
  const given = args.filter((arg) => !arg.startsWith('-'));

  if (given.length === 0) {
    console.error('usage: repo-eslint-staged [--check] <file>…');
    process.exitCode = 2;
    return;
  }

  const fix = !args.includes('--check');
  const groups = planLintGroups({
    paths: given
      .map((arg) => resolve(REPO_ROOT, arg))
      .filter((path) => existsSync(path)),
    repoRoot: REPO_ROOT,
  });
  const failed = groups.filter((group) => !runGroup({ ...group, fix }));

  if (failed.length > 0) {
    reportFailures(failed);
    process.exitCode = 1;
  }
};

main();
