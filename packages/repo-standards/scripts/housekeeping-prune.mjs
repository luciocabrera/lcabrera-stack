#!/usr/bin/env node
/**
 * `vp run housekeeping:prune` — the periodic broom for a shared, multi-agent
 * checkout. It deletes local branches whose PR has merged or closed, removes
 * clean worktrees whose branch has merged or that are detached on a commit the
 * default branch contains, and removes stopped or orphaned throwaway
 * containers. It reports, and never touches, branches with unique un-PR'd
 * commits, worktrees with a change no history holds, and stashes. A dirty
 * worktree whose every change is already in history goes only with
 * `--include-superseded`.
 *
 * PR state comes from `gh pr list --json`, piped in by the `housekeeping:prune`
 * package.json script; this file never spawns `gh` (Sonar S4036). With no PR
 * JSON on stdin it degrades: a branch is judged by its unique-commit count
 * alone, and a worktree that needs a PR state is kept.
 *
 * Usage (from the repo root):
 *   vp run housekeeping:prune                    # dry run — print the plan
 *   vp run housekeeping:prune -- --apply         # perform it
 *   vp run housekeeping:prune -- --apply --include-superseded
 *   repo-housekeeping-prune --hint [--threshold <n>] [--advice "<text>"]
 *     # local refs only, no stdin; the advice ends the line
 *
 * Exit code is 0 unless --apply hits an error, --threshold is not a number,
 * or --advice has no text. REPO_STANDARDS_NO_DOCKER set to any non-empty value
 * turns the container checks off, so a run never reaches the machine's Docker;
 * REPO_STANDARDS_DOCKER names the docker executable by absolute path instead of
 * the fixed install directories.
 */
import { dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

import { readStdin } from './cli-input.mjs';
import { parsePullRequests } from './gh-exec.mjs';
import { resolveHostRoot } from './host-root.mjs';
import { runHint, runPrune } from './housekeeping-run.mjs';

const REPO_ROOT = resolveHostRoot({
  moduleDirectory: dirname(fileURLToPath(import.meta.url)),
});

const report = ({ code, errors, lines }) => {
  for (const line of lines) process.stdout.write(`${line}\n`);
  for (const line of errors) process.stderr.write(`${line}\n`);
  process.exitCode = code;
};

const main = async () => {
  const argv = process.argv.slice(2);
  if (argv.includes('--hint')) {
    report(runHint({ argv, root: REPO_ROOT }));
    return;
  }
  const pullRequests = parsePullRequests(await readStdin(), {
    warning:
      '  ⚠ could not parse `gh pr list` JSON — using commit counts only.\n',
  });
  report(runPrune({ argv, pullRequests, root: REPO_ROOT }));
};

await main();
