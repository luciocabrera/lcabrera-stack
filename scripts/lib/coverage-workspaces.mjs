/**
 * The workspace membership behind the two coverage lanes, in one importable
 * place so it can be asserted instead of only reviewed.
 *
 * These lists used to live as module-scope consts inside `coverage-report.mjs`
 * and `merge-coverage.mjs`, which both run `main()` on import — so no test could
 * reach them. That is how `@lcabrera/api` went missing from the PR comment for the
 * whole life of the runtime split (ADR-038): #158 rewrote the single
 * `data-access` row into `server`, correct for the Node half, while the browser
 * half became its own package and never got a row. Nothing failed, because a
 * report with a row missing looks exactly like a complete one.
 *
 * The two lanes are related but deliberately NOT derived from each other — see
 * each list's own note for what it excludes and why.
 *
 * `publicPackageDirs` resolves the never-baseline packages from the same
 * authority AGENTS.md names — the workspaces whose gitignore covers
 * `eslint-suppressions.json` — rather than restating a list that would drift the
 * moment another package joins. It is what `vp run suppressions:packages` prints,
 * and it is the only statement of that roster. Keying on the DIRECTORY, not the
 * package name, also keeps the invariant intact across an npm scope rename.
 */
import { readdirSync } from 'node:fs';
import { join } from 'node:path';

import { readTextWithin } from '../../packages/repo-standards/scripts/safe-read.mjs';

/** Workspace roots that can hold a publishable package. */
const WORKSPACE_ROOTS = ['packages', 'apps'];

/** The gitignore entry that marks a package as never-baseline (AGENTS.md §1). */
const SUPPRESSIONS_MARKER = 'eslint-suppressions';

/**
 * Workspaces the PR comment reports, most-critical first.
 *
 * `run: true`  — this script runs its `test:coverage` (it runs plain `test`
 *                during `test:ci`, so no summary exists yet).
 * `run: false` — its `coverage-summary.json` is already produced upstream
 *                (the showcase emits it from its own `test:ci`, and re-running
 *                the repo's largest suite here would be wasteful). `--all`
 *                overrides this for standalone local runs where `test:ci` has
 *                not run first.
 */
export const COVERAGE_REPORT_WORKSPACES = [
  { dir: 'packages/ui', name: '@lcabrera/ui', run: true },
  // The two halves of the former `data-access`, split by runtime (ADR-038).
  { dir: 'packages/server', name: '@lcabrera/server', run: true },
  { dir: 'packages/api', name: '@lcabrera/api', run: true },
  { dir: 'apps/showcase', name: 'showcase', run: false },
  // Phase 2 — remaining library packages with a DB-free test:coverage.
  { dir: 'packages/node-runtime', name: '@lcabrera/node', run: true },
  { dir: 'packages/utils', name: '@lcabrera/utils', run: true },
  // Phase 3, second pass. Written off as "config/CLI-only with nothing to
  // cover"; that stopped being true once eslint-local-rules gained a suite per
  // rule (#205). Its tests are a lint RuleTester, so it reaches no service.
  {
    dir: 'packages/eslint-local-rules',
    name: '@lcabrera/eslint-plugin',
    run: true,
  },
  // Pure factories plus a writer whose one effect is injected, so the whole
  // package is covered without a filesystem (ADR-069 split it out of
  // `@repo/ts-configs`, which keeps only this repo's entry table).
  { dir: 'packages/tsconfig', name: '@lcabrera/tsconfig', run: true },
  // The scan runners' own pure halves — host-root derivation and ingestion
  // configuration. The runners themselves shell out to lint tools and are
  // exercised by running them, not by a unit suite.
  // Reference extraction, path classification and the manifest state machine
  // are pure; the filesystem is reached only by the thin command shells around
  // them, so the suite runs without one.
  { dir: 'packages/devkit', name: '@lcabrera/devkit', run: true },
  // The convention spec and the four gates built on it: pure parsing and
  // validation, with the git and filesystem reads at the command edges.
  {
    dir: 'packages/repo-standards',
    name: '@lcabrera/repo-standards',
    run: true,
  },
  // The shell fragment the `start` task emits, and the React Router asset
  // plugin folded in from `@repo/plugins` — the plugin's filesystem calls are
  // an injected seam, so its suite runs against an in-memory one (ADR-069).
  { dir: 'packages/vite-configs', name: '@lcabrera/vite-config', run: true },
];

/**
 * Workspaces merged into the coverage fallow reads.
 *
 * Opt-in by design: an earlier attempt at this lever was reverted (2026-07-14)
 * for pulling in a suite that needed Postgres, so a new workspace is added here
 * only once its coverage task is known to run clean without one.
 *
 * Deliberately absent: `showcase` (apps/showcase) — the showcase
 * app. Its fallow findings are baselined, so coverage buys the gate nothing
 * today, and its suite is the largest in the repo. This is why the two lists are
 * not derived from one another.
 */
export const COVERAGE_MERGE_WORKSPACES = [
  { dir: 'packages/api', name: '@lcabrera/api' },
  { dir: 'packages/devkit', name: '@lcabrera/devkit' },
  { dir: 'packages/repo-standards', name: '@lcabrera/repo-standards' },
  { dir: 'packages/eslint-local-rules', name: '@lcabrera/eslint-plugin' },
  { dir: 'packages/node-runtime', name: '@lcabrera/node' },
  { dir: 'packages/server', name: '@lcabrera/server' },
  { dir: 'packages/tsconfig', name: '@lcabrera/tsconfig' },
  { dir: 'packages/ui', name: '@lcabrera/ui' },
  { dir: 'packages/utils', name: '@lcabrera/utils' },
  { dir: 'packages/vite-configs', name: '@lcabrera/vite-config' },
];

/** Whether a workspace directory gitignores its eslint suppressions file. */
const ignoresSuppressions = (repoRoot, dir) => {
  try {
    return readTextWithin(join(repoRoot, dir, '.gitignore'), repoRoot).includes(
      SUPPRESSIONS_MARKER,
    );
  } catch {
    // No gitignore at all — the common case, and not a public package.
    return false;
  }
};

/** Workspace directories inside one root, as repo-relative paths. */
const workspaceDirsIn = (repoRoot, root) => {
  try {
    return readdirSync(join(repoRoot, root), { withFileTypes: true })
      .filter((entry) => entry.isDirectory())
      .map((entry) => `${root}/${entry.name}`);
  } catch {
    return [];
  }
};

/**
 * The never-baseline (public-facing) package directories, repo-relative.
 *
 * Derived rather than listed: AGENTS.md states the authority is which
 * workspaces gitignore `eslint-suppressions.json`, so a new public package
 * extends every check built on this without editing them.
 */
export const publicPackageDirs = (repoRoot) =>
  WORKSPACE_ROOTS.flatMap((root) => workspaceDirsIn(repoRoot, root))
    .filter((dir) => ignoresSuppressions(repoRoot, dir))
    // Explicit comparator: a bare `.sort()` coerces to string and sorts by UTF-16
    // code unit, which happens to be right for these paths but is not stated
    // (Sonar S2871). Ordering only needs to be stable for readable output.
    .sort((left, right) => left.localeCompare(right));
