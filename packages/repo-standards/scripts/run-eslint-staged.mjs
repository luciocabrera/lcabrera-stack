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
 * Every decision this makes lives in `eslint-staged.mjs`, which is pure and
 * tested; what is left here spawns, reads the filesystem and prints.
 *
 * The ESLint it runs is the workspace's own, with no fallback: a workspace that
 * declares none is reported as one this could not lint, rather than silently
 * linted by whichever version some ancestor happens to hoist.
 *
 * Usage:
 *   repo-eslint-staged <file>…
 *   repo-eslint-staged --check <file>…
 *   repo-eslint-staged [--check] -- <file>…   (names starting with `-`)
 *
 * Exit codes: 0 = clean, 1 = findings remain, 2 = it could not run — no file
 * arguments, a bad option, a path that does not exist, or an ESLint that failed
 * to start. Handing it only files no workspace config governs is 0: that is the
 * commit hook staging a README, not a failure.
 */
import { spawnSync } from 'node:child_process';
import { existsSync, readFileSync } from 'node:fs';
import { dirname, join, relative, resolve } from 'node:path';
import process from 'node:process';
import { fileURLToPath } from 'node:url';

import { errorMessage } from './error-message.mjs';
import {
  argumentError,
  eslintArguments,
  exitCodeFor,
  lintScriptOf,
  parseArguments,
  planLintGroups,
  spawnOutcome,
  workspaceEslintFlags,
} from './eslint-staged.mjs';
import { resolveHostRoot } from './host-root.mjs';

const REPO_ROOT = resolveHostRoot({
  moduleDirectory: dirname(fileURLToPath(import.meta.url)),
});

const manifestScripts = (directory) => {
  const manifest = join(directory, 'package.json');
  if (!existsSync(manifest)) return;
  return JSON.parse(readFileSync(manifest, 'utf8')).scripts;
};

const flagsFor = (directory) =>
  workspaceEslintFlags(lintScriptOf(manifestScripts(directory)));

const reportBroken = (directory, reason) => {
  console.error(
    `\nESLint could not be run in ${relative(REPO_ROOT, directory)}: ${reason}\n`,
  );
};

const spawnEslint = ({ binary, directory, files, fix }) => {
  const { error, status } = spawnSync(
    binary,
    eslintArguments({ files, fix, workspaceFlags: flagsFor(directory) }),
    { cwd: directory, stdio: 'inherit' },
  );
  const outcome = spawnOutcome(status);
  if (outcome === 'broken') {
    reportBroken(directory, error?.message ?? `it exited ${status}`);
  }
  return outcome;
};

const lintGroup = ({ directory, files, fix }) => {
  const binary = join(directory, 'node_modules', '.bin', 'eslint');
  if (existsSync(binary)) return spawnEslint({ binary, directory, files, fix });
  reportBroken(directory, 'it declares no eslint of its own');
  return 'broken';
};

const report = (label, outcomes, kind) => {
  const directories = outcomes
    .filter((entry) => entry.outcome === kind)
    .map((entry) => `  • ${relative(REPO_ROOT, entry.directory)}`);
  if (directories.length === 0) return;
  console.error(
    `\n${label} in ${directories.length} workspace(s):\n${directories.join('\n')}\n`,
  );
};

const main = () => {
  const {
    check,
    paths: given,
    unknown,
  } = parseArguments(process.argv.slice(2));
  const paths = given.map((argument) => resolve(process.cwd(), argument));
  const missing = paths
    .filter((path) => !existsSync(path))
    .map((path) => relative(process.cwd(), path));

  const problem = argumentError({ missing, paths: given, unknown });
  if (problem !== undefined) {
    console.error(`repo-eslint-staged: ${problem}`);
    process.exitCode = 2;
    return;
  }

  const outcomes = planLintGroups({ paths, repoRoot: REPO_ROOT }).map(
    (group) => ({
      directory: group.directory,
      outcome: lintGroup({ ...group, fix: !check }),
    }),
  );

  report('ESLint findings remain', outcomes, 'findings');
  report('ESLint could not run', outcomes, 'broken');
  process.exitCode = exitCodeFor(outcomes.map((entry) => entry.outcome));
};

try {
  main();
} catch (error) {
  console.error(`repo-eslint-staged: ${errorMessage(error)}`);
  process.exitCode = 2;
}
