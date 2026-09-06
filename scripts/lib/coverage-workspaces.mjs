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

const WORKSPACE_ROOTS = ['packages', 'apps'];

const SUPPRESSIONS_MARKER = 'eslint-suppressions';

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
  // The published initializer, which is one spawn: its suite runs the bin and
  // reads what the wrapped CLI printed, so the file itself is loaded in a child
  // process and contributes no lines here (ADR-110).
  {
    dir: 'packages/create-lcabrera-stack',
    name: 'create-lcabrera-stack',
    run: true,
  },
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

export const COVERAGE_MERGE_WORKSPACES = [
  { dir: 'packages/api', name: '@lcabrera/api' },
  { dir: 'packages/create-lcabrera-stack', name: 'create-lcabrera-stack' },
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

const ignoresSuppressions = (repoRoot, dir) => {
  try {
    return readTextWithin(join(repoRoot, dir, '.gitignore'), repoRoot).includes(
      SUPPRESSIONS_MARKER,
    );
  } catch {
    return false;
  }
};

const workspaceDirsIn = (repoRoot, root) => {
  try {
    return readdirSync(join(repoRoot, root), { withFileTypes: true })
      .filter((entry) => entry.isDirectory())
      .map((entry) => `${root}/${entry.name}`);
  } catch {
    return [];
  }
};

export const publicPackageDirs = (repoRoot) =>
  WORKSPACE_ROOTS.flatMap((root) => workspaceDirsIn(repoRoot, root))
    .filter((dir) => ignoresSuppressions(repoRoot, dir))
    .sort((left, right) => left.localeCompare(right));
