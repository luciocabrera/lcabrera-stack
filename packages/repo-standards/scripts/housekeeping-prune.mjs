#!/usr/bin/env node
/**
 * `vp run housekeeping:prune` — the periodic broom for a shared, multi-agent
 * checkout. It deletes local branches whose PR has merged or closed and removes
 * clean worktrees whose branch has merged; it *reports* — and never touches —
 * branches with unique un-PR'd commits, worktrees with uncommitted changes, and
 * stashes. So the mess a parallel crew leaves behind (a 2026-07-23 audit found
 * ~90 stale local branches) is one command away from gone, while anything that
 * might be real work is surfaced for a human, not destroyed.
 *
 * WHY IT READS STDIN
 * ------------------
 * PR state comes from `gh pr list --json`, piped in from the `housekeeping:prune`
 * package.json script; this file never spawns `gh`. That keeps it off the
 * "OS command resolved via PATH" hotspot (Sonar S4036) — the same discipline as
 * `coordination-board-live.mjs`. Git *is* spawned, but only through the hardened
 * `runGit` (absolute binary, scrubbed environment).
 *
 * Usage (from the repo root):
 *   vp run housekeeping:prune            # dry run — print the plan, change nothing
 *   vp run housekeeping:prune -- --apply # perform the deletions the plan lists
 *
 * With no PR JSON on stdin (no `gh`, no token) it degrades safely: a branch is
 * classified from its unique-commit count alone, so nothing with commits is ever
 * deleted without PR confirmation. Exit code is 0 unless --apply hits an error.
 */
import { dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

import { readStdin } from './cli-input.mjs';
import { readConventions } from './config.mjs';
import { runGit } from './git-exec.mjs';
import { resolveHostRoot } from './host-root.mjs';
import {
  buildPlan,
  parseWorktrees,
  summarizePrs,
} from './housekeeping-plan.mjs';

const REPO_ROOT = resolveHostRoot({
  moduleDirectory: dirname(fileURLToPath(import.meta.url)),
});
const UPSTREAM = `origin/${readConventions(REPO_ROOT).defaultBranch}`;
const KEEP = new Set([]);

const parsePullRequests = (raw) => {
  if (!raw.trim()) {
    return [];
  }
  try {
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    process.stderr.write(
      '  ⚠ could not parse `gh pr list` JSON — using commit counts only.\n',
    );
    return [];
  }
};

const prVerdictsByHead = (pullRequests) => {
  const grouped = new Map();
  for (const pr of pullRequests) {
    const list = grouped.get(pr.headRefName) ?? [];
    list.push(pr);
    grouped.set(pr.headRefName, list);
  }
  return new Map([...grouped].map(([head, prs]) => [head, summarizePrs(prs)]));
};

const gitLines = (args) => {
  const out = runGit({ args, cwd: REPO_ROOT });
  return out ? out.split('\n').filter(Boolean) : [];
};

const uniqueCountsByBranch = (branches) => {
  const counts = new Map();
  for (const branch of branches) {
    const out = runGit({
      args: ['rev-list', '--count', `${UPSTREAM}..${branch}`],
      cwd: REPO_ROOT,
    });
    counts.set(branch, out === undefined ? undefined : Number(out));
  }
  return counts;
};

const worktreesWithDirt = () => {
  const worktrees = parseWorktrees(
    runGit({ args: ['worktree', 'list', '--porcelain'], cwd: REPO_ROOT }),
  );
  return worktrees.map((worktree) => {
    const status = runGit({
      args: ['status', '--porcelain'],
      cwd: worktree.path,
    });
    return { ...worktree, dirty: Boolean(status && status.length > 0) };
  });
};

const gatherState = (prByHead) => {
  const branches = gitLines(['branch', '--format=%(refname:short)']);
  const worktrees = worktreesWithDirt();
  return {
    branches,
    checkedOutBranches: new Set(worktrees.map((w) => w.branch).filter(Boolean)),
    currentBranch:
      runGit({ args: ['branch', '--show-current'], cwd: REPO_ROOT }) ||
      undefined,
    keep: KEEP,
    prByHead,
    stashes: gitLines(['stash', 'list']),
    uniqueByBranch: uniqueCountsByBranch(branches),
    worktrees,
  };
};

const printSection = (title, rows) => {
  process.stdout.write(`\n${title}\n`);
  if (rows.length === 0) {
    process.stdout.write('  (none)\n');
    return;
  }
  for (const row of rows) {
    process.stdout.write(`  ${row}\n`);
  }
};

const printPlan = (plan, apply) => {
  process.stdout.write(
    apply
      ? 'housekeeping:prune — applying\n'
      : 'housekeeping:prune — dry run (pass --apply to act)\n',
  );
  printSection(
    apply
      ? 'Deleting branches (merged/closed PR or cruft):'
      : 'Would delete branches (merged/closed PR or cruft):',
    plan.deleteBranches.map((b) => `${b.name} — ${b.reason}`),
  );
  printSection(
    apply
      ? 'Removing worktrees (branch merged, clean):'
      : 'Would remove worktrees (branch merged, clean):',
    plan.removeWorktrees.map((w) => `${w.path} [${w.branch}] — ${w.reason}`),
  );
  printSection('KEEPING — review by hand, never auto-deleted:', [
    ...plan.reportBranches.map((b) => `branch ${b.name} — ${b.reason}`),
    ...plan.reportWorktrees.map((w) => `worktree ${w.path} — ${w.reason}`),
    ...plan.stashes.map((s) => `stash ${s}`),
  ]);
};

const applyPlan = (plan) => {
  const failures = [];
  for (const worktree of plan.removeWorktrees) {
    if (
      runGit({
        args: ['worktree', 'remove', worktree.path],
        cwd: REPO_ROOT,
      }) === undefined
    ) {
      failures.push(`worktree ${worktree.path}`);
    }
  }
  for (const branch of plan.deleteBranches) {
    if (
      runGit({ args: ['branch', '-D', branch.name], cwd: REPO_ROOT }) ===
      undefined
    ) {
      failures.push(`branch ${branch.name}`);
    }
  }
  return failures;
};

const main = async () => {
  const apply = process.argv.includes('--apply');
  const prByHead = prVerdictsByHead(parsePullRequests(await readStdin()));
  const plan = buildPlan(gatherState(prByHead));

  printPlan(plan, apply);

  if (!apply) {
    return;
  }
  const failures = applyPlan(plan);
  if (failures.length > 0) {
    process.stderr.write(`\n  ⚠ ${failures.length} operation(s) failed:\n`);
    for (const failure of failures) {
      process.stderr.write(`    ${failure}\n`);
    }
    process.exitCode = 1;
  }
};

await main();
