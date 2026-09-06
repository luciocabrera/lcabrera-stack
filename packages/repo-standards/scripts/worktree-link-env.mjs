#!/usr/bin/env node
/**
 * Link the primary checkout's gitignored env files into a linked worktree.
 *
 * Why this exists: env files are gitignored, so a fresh worktree has none, and a
 * DB-touching command there does not fail — it runs with the env unloaded, which
 * reads as a code bug rather than a missing file. Claiming a task installs
 * dependencies and generates route types but deliberately stops short of this:
 * provisioning credentials into a new checkout is the user's call, not a side
 * effect of claiming. This script is that call, made in one command.
 *
 * Symlinks, never copies. A copy puts a second credential on disk that drifts
 * from the original and outlives the worktree; a link resolves to the one file
 * and disappears with the worktree. Nothing here opens a matched file — paths are
 * discovered and linked, contents are never read.
 *
 * Usage: repo-worktree-env [--target <dir>] [--dry-run]
 * Exit  : 0 on success (including "nothing to link"), 1 when git cannot resolve
 *         the target as a checkout of this repo.
 *
 * Decisions worth testing live in ./worktree-env.mjs.
 * Governed by .claude/rules/scripts.md.
 */
import {
  existsSync,
  lstatSync,
  mkdirSync,
  readdirSync,
  symlinkSync,
} from 'node:fs';
import { dirname, join, relative, resolve } from 'node:path';

import { runGit, runGitStatus } from './git-exec.mjs';
import {
  isEnvFileName,
  linkTextFor,
  parseArgs,
  SKIPPED_DIRS,
  summarize,
} from './worktree-env.mjs';

const git = (args, cwd) => {
  const out = runGit({ args, cwd });
  if (out === undefined) {
    throw new Error(`git ${args.join(' ')} failed in ${cwd}`);
  }
  return out;
};

const isNestedCheckout = (dir) => existsSync(join(dir, '.git'));

const findEnvFiles = (root, current = root, found = []) => {
  for (const entry of readdirSync(current, { withFileTypes: true })) {
    const full = join(current, entry.name);
    if (entry.isDirectory()) {
      if (!SKIPPED_DIRS.has(entry.name) && !isNestedCheckout(full)) {
        findEnvFiles(root, full, found);
      }
    } else if (isEnvFileName(entry.name)) {
      found.push(relative(root, full));
    }
  }
  return found;
};

const keepIgnored = (root, relPaths) => {
  if (relPaths.length === 0) return [];
  const { status, stdout } = runGitStatus({
    args: ['check-ignore', '--', ...relPaths],
    cwd: root,
  });
  if (status === 0) return stdout.split('\n').filter(Boolean);
  if (status === 1) return [];
  throw new Error(
    `git check-ignore failed in ${root} (exit ${status ?? 'not spawned'})`,
  );
};

const linkOne = ({ sourceRoot, targetRoot, relPath, dryRun }) => {
  const destination = join(targetRoot, relPath);
  if (lstatSync(destination, { throwIfNoEntry: false })) {
    return { relPath, status: 'exists' };
  }
  if (dryRun) return { relPath, status: 'would-link' };
  mkdirSync(dirname(destination), { recursive: true });
  symlinkSync(linkTextFor(join(sourceRoot, relPath), destination), destination);
  return { relPath, status: 'linked' };
};

const main = () => {
  const { target, dryRun } = parseArgs(process.argv.slice(2), process.cwd());
  const primaryRoot = dirname(
    resolve(target, git(['rev-parse', '--git-common-dir'], target)),
  );
  const targetRoot = resolve(git(['rev-parse', '--show-toplevel'], target));

  if (targetRoot === resolve(primaryRoot)) {
    process.stdout.write(
      'This IS the primary checkout — its env files are already in place.\n',
    );
    return;
  }

  const candidates = keepIgnored(primaryRoot, findEnvFiles(primaryRoot));
  if (candidates.length === 0) {
    process.stdout.write('No gitignored env files in the primary checkout.\n');
    return;
  }

  const results = candidates.map((relPath) =>
    linkOne({ sourceRoot: primaryRoot, targetRoot, relPath, dryRun }),
  );
  for (const { relPath, status } of results) {
    process.stdout.write(`  ${status.padEnd(10)} ${relPath}\n`);
  }
  const label = relative(primaryRoot, targetRoot) || targetRoot;
  process.stdout.write(`${summarize(results, dryRun, label)}\n`);
};

try {
  main();
} catch (error) {
  process.stderr.write(`worktree-link-env: ${error.message}\n`);
  process.exitCode = 1;
}
