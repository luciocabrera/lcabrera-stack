/**
 * Turns a list of changed files into the exact `vp run` test groups needed to
 * cover them — the brain behind `vp run test:changed`. A change to one workspace
 * must also re-test every workspace that DEPENDS on it (a `packages/ui` edit can
 * break `apps/react-router`), so this walks the workspace dependency graph
 * (built from each package.json's `workspace:*` deps) to add transitive
 * dependents. Only the few files that change how every workspace resolves its
 * tests — the lockfile, the workspace manifest, the root Vite+ config, and the
 * shared `vite-configs`/`ts-configs` build machinery — force the FULL suite;
 * every other out-of-workspace file (root package.json scripts, docs, tooling)
 * affects no suite and is ignored. Lint/format-only configs (the `vite-configs`
 * eslint/oxlint/oxfmt factories, any `eslint.config.mjs`) are dropped before
 * selection and force nothing — the linters gate them on every PR regardless
 * (see `LINT_ONLY_PATTERNS`).
 *
 * The per-workspace task substitution mirrors `test:ci` exactly so the two never
 * diverge: the DB-bound scan packages run their DB-free `test:unit`, and (in CI
 * mode) `vite-react-compiler` runs its coverage `test:ci` last. A FULL run is
 * just "every workspace is affected", so it reproduces `test:ci` by construction.
 *
 * Effectful only in `readWorkspaceGraph` (reads package.json files); the rest is
 * pure and drives the runner in `scripts/test-changed.mjs`. See
 * `.claude/rules/scripts.md`.
 */
import { readFileSync } from 'node:fs';
import { join } from 'node:path';

import { deriveWorkspaces, workspacesForFiles } from './workspace-scopes.mjs';

/** Package names whose DB-free subset runs as `test:unit` (see `test:ci`). */
export const UNIT_TASK_PACKAGES = [
  '@repo/scan-ingestion',
  '@repo/scan-orchestrator',
];

/** The one package that emits the PR coverage summary via its `test:ci`. */
export const COVERAGE_TASK_PACKAGE = 'vite-react-compiler';

/**
 * Package names whose change forces a full run because they define the shared
 * test/tsconfig machinery every other workspace's task is built from.
 */
const GLOBAL_PACKAGES = new Set(['@repo/vite-configs', '@repo/ts-configs']);

/**
 * Files that change how EVERY workspace builds or resolves its tests, so a diff
 * touching one forces the full suite: the lockfile, the workspace manifest, and
 * the root Vite+ config (which owns the shared run/test tasks). This stays small
 * on purpose — a real dependency change always updates `pnpm-lock.yaml`, so every
 * OTHER out-of-workspace file (root package.json scripts, lint/tsconfig configs,
 * docs) affects no workspace suite. The shared config packages force a full run
 * too, via GLOBAL_PACKAGES; `scripts/` runs its own `test:scripts` (see
 * `SCRIPTS_TEST_PATTERN`), not the workspace suites.
 */
const FORCE_FULL_PATTERNS = [
  /^pnpm-lock\.yaml$/,
  /^pnpm-workspace\.yaml$/,
  /^vite\.config\.ts$/,
];

const forcesFullRun = (files) =>
  files.some((file) =>
    FORCE_FULL_PATTERNS.some((pattern) => pattern.test(file)),
  );

/**
 * Files that only affect linting/formatting and never how a test builds or runs,
 * so they drop out of the diff before selection: a change touching only these
 * runs no test and no typecheck. This is safe because the eslint/oxlint/oxfmt
 * passes are NOT change-gated — they run on every PR unconditionally — so such a
 * change is always validated by the linters, and lint config cannot affect a
 * test. Deliberately tight: the shared `vite-configs` eslint.* factories (nothing
 * but a workspace's own `eslint.config.mjs` imports them) and the Oxlint/Oxfmt
 * config factories `vite.lint`/`vite.fmt` — NOT `vite.run`/`vite.pack`/
 * `vite.plugins`, which do drive the test/build. A diff mixing one of these with
 * a real source edit still selects on that edit.
 */
const LINT_ONLY_PATTERNS = [
  /^packages\/vite-configs\/eslint\./,
  /^packages\/vite-configs\/vite\.(lint|fmt)\.shared\.config\.ts$/,
  /(^|\/)eslint\.config\.mjs$/,
];

const isLintOnly = (file) =>
  LINT_ONLY_PATTERNS.some((pattern) => pattern.test(file));

/** The root task (`vitest run --root scripts`) covering the `scripts/` tests. */
export const SCRIPTS_TEST_TASK = 'test:scripts';

/**
 * Scripts under `scripts/` are tooling in no workspace, so the workspace
 * selection never covers them — yet they carry real tests (the `scripts/` test
 * files, run by `test:scripts`). A diff touching a script runs that suite; the
 * workspace `test:changed` never would. Code files only — a docs or JSON change
 * under `scripts/` needs no test.
 */
const SCRIPTS_TEST_PATTERN = /^scripts\/.+\.(mjs|cjs|js)$/;

const touchesScripts = (files) =>
  files.some((file) => SCRIPTS_TEST_PATTERN.test(file));

/** The workspace package names declared as `workspace:*` deps of a manifest. */
const workspaceDeps = (manifest, packageNames) => {
  const all = {
    ...manifest.dependencies,
    ...manifest.devDependencies,
    ...manifest.peerDependencies,
  };
  return new Set(Object.keys(all).filter((name) => packageNames.has(name)));
};

/**
 * Every workspace tagged with its directory, package name, and the set of other
 * workspace packages it depends on. Reads package.json for each (the only I/O).
 */
export const readWorkspaceGraph = (repoRoot) => {
  const located = deriveWorkspaces(repoRoot).map((workspace) => {
    const dir = `${workspace.kind === 'app' ? 'apps' : 'packages'}/${workspace.name}`;
    const manifest = JSON.parse(
      readFileSync(join(repoRoot, dir, 'package.json'), 'utf8'),
    );
    return { ...workspace, dir, pkgName: manifest.name, manifest };
  });
  const packageNames = new Set(located.map((workspace) => workspace.pkgName));
  return located.map((workspace) => ({
    name: workspace.name,
    kind: workspace.kind,
    dir: workspace.dir,
    pkgName: workspace.pkgName,
    deps: workspaceDeps(workspace.manifest, packageNames),
  }));
};

/** Reverse the dependency graph: package name → the packages that depend on it. */
export const buildDependents = (graph) => {
  const dependents = new Map(
    graph.map((workspace) => [workspace.pkgName, new Set()]),
  );
  for (const workspace of graph) {
    for (const dep of workspace.deps) {
      dependents.get(dep)?.add(workspace.pkgName);
    }
  }
  return dependents;
};

/** The seed packages plus every package that transitively depends on them. */
export const withDependents = (seeds, dependents) => {
  const affected = new Set(seeds);
  const worklist = [...seeds];
  while (worklist.length > 0) {
    const pkg = worklist.pop();
    for (const dependent of dependents.get(pkg) ?? []) {
      if (!affected.has(dependent)) {
        affected.add(dependent);
        worklist.push(dependent);
      }
    }
  }
  return affected;
};

/**
 * Split affected packages into ordered `vp run` groups mirroring `test:ci`:
 * plain `test` first, DB-free `test:unit` for the scan packages, then (CI only)
 * `vite-react-compiler`'s coverage `test:ci` LAST so its summary is the fresh one.
 * Empty groups are dropped. Without `ci`, react-router runs plain `test`.
 */
export const partitionTasks = (affectedPackages, { ci = false } = {}) => {
  const affected = new Set(affectedPackages);
  const unit = UNIT_TASK_PACKAGES.filter((pkg) => affected.has(pkg));
  const useCoverage = ci && affected.has(COVERAGE_TASK_PACKAGE);
  const special = new Set([
    ...unit,
    ...(useCoverage ? [COVERAGE_TASK_PACKAGE] : []),
  ]);
  const plain = [...affected].filter((pkg) => !special.has(pkg));
  return [
    { task: 'test', packages: plain },
    { task: 'test:unit', packages: unit },
    ...(useCoverage
      ? [{ task: 'test:ci', packages: [COVERAGE_TASK_PACKAGE] }]
      : []),
  ].filter((group) => group.packages.length > 0);
};

/**
 * The affected package names for a diff: `{ mode, packages }`, where mode is
 * `none` (nothing to run), `full` (root/shared change → every workspace), or
 * `scoped` (changed workspaces plus their transitive dependents). The shared
 * core both the test runner and the coverage report scope themselves by.
 */
export const resolveAffected = ({ files, graph }) => {
  // Lint/format-only configs never change how a test builds or runs, so drop
  // them before selection — a diff of only these selects nothing (the linters
  // gate them on every PR regardless). This is also what stops an eslint change
  // to the shared `vite-configs` package from forcing the full suite via
  // GLOBAL_PACKAGES below.
  const relevant = files.filter((file) => !isLintOnly(file));
  // `scripts/` is tooling in no workspace, so it never lands in `packages`; carry
  // it as its own flag so the test runner can add the root `test:scripts` group
  // (the workspace-oriented mode/packages stay about workspaces).
  const scripts = touchesScripts(relevant);
  if (relevant.length === 0) {
    return { mode: 'none', packages: [], changed: [], scripts };
  }
  const changedWorkspaces = workspacesForFiles(relevant, graph);
  const changed = changedWorkspaces.map((workspace) => workspace.pkgName);
  const forceFull =
    forcesFullRun(relevant) ||
    changedWorkspaces.some((workspace) =>
      GLOBAL_PACKAGES.has(workspace.pkgName),
    );
  if (forceFull) {
    return {
      mode: 'full',
      packages: graph.map((workspace) => workspace.pkgName),
      changed,
      scripts,
    };
  }
  if (changed.length === 0) {
    return { mode: 'none', packages: [], changed: [], scripts };
  }
  const affected = withDependents(changed, buildDependents(graph));
  return { mode: 'scoped', packages: [...affected], changed, scripts };
};

/**
 * The plan for a diff: `{ mode, groups, packages, changed, scripts }` —
 * `resolveAffected` split into the ordered `vp run` groups (see `partitionTasks`),
 * plus the raw affected/changed package sets so the caller can report
 * per-workspace. When the diff touched `scripts/`, the root `test:scripts` group
 * is appended (empty `packages` → `vpArgsFor` runs it filter-less) so those
 * suites run on PRs, not only in the full `test:ci` on `main`. It goes last so a
 * coverage `test:ci` group still writes the summary before it; `test:scripts`
 * emits no coverage of its own.
 */
export const resolveTestGroups = ({ files, graph, ci = false }) => {
  const { mode, packages, changed, scripts } = resolveAffected({
    files,
    graph,
  });
  const groups = partitionTasks(packages, { ci });
  if (scripts) {
    groups.push({ task: SCRIPTS_TEST_TASK, packages: [] });
  }
  return { mode, packages, changed, scripts, groups };
};

/** The reason a workspace is (not) running, for the human summary. */
const dispositionReason = (running, isChanged) => {
  if (!running) {
    return 'no changes detected';
  }
  return isChanged ? 'changed' : 'depends on a changed package';
};

/**
 * Per-workspace disposition for a human summary: every workspace tagged running
 * (with its task and why) or skipped. `changed` are the directly-changed
 * packages; the rest of `affected` are pulled in as dependents.
 */
export const workspaceDispositions = ({ graph, affected, changed, groups }) => {
  const affectedSet = new Set(affected);
  const changedSet = new Set(changed);
  const taskByPackage = new Map(
    groups.flatMap((group) => group.packages.map((pkg) => [pkg, group.task])),
  );
  return graph.map((workspace) => {
    const running = affectedSet.has(workspace.pkgName);
    return {
      dir: workspace.dir,
      pkgName: workspace.pkgName,
      running,
      reason: dispositionReason(running, changedSet.has(workspace.pkgName)),
      task: taskByPackage.get(workspace.pkgName),
    };
  });
};

/**
 * A GitHub-flavoured markdown version of the disposition report, for the CI
 * job summary and the PR comment — so the change-based selection is visible in
 * the PR, not hidden in the logs. `title` is also the sticky-comment marker (a
 * distinct one per task), so keep it stable; it defaults to the tests' heading.
 */
export const renderSelectionMarkdown = (
  mode,
  dispositions,
  { title = '🧪 Test Selection', scripts = false } = {},
) => {
  const running = dispositions.filter((disposition) => disposition.running);
  const skipped = dispositions.filter((disposition) => !disposition.running);
  const total = dispositions.length;
  const headline =
    mode === 'full'
      ? `**Full run** — a shared or root file changed, so all ${total} workspaces run.`
      : `**${running.length} of ${total} workspaces** affected by this change; the rest are skipped (no changes detected).`;
  // The `scripts/` suites are a root task in no workspace, so they never appear
  // in the per-workspace table — call them out explicitly when they run.
  const scriptsNote = scripts
    ? ['> Plus `test:scripts` — a `scripts/` file changed.', '']
    : [];
  const runningBlock =
    running.length === 0
      ? []
      : [
          '### ▶ Running',
          '',
          '| Workspace | Task | Why |',
          '| --- | --- | --- |',
          ...running.map(
            ({ dir, task, reason }) =>
              `| \`${dir}\` | \`${task}\` | ${reason} |`,
          ),
          '',
        ];
  const skippedBlock =
    skipped.length === 0
      ? []
      : [
          '### ⏭ Skipped — no changes detected',
          '',
          skipped.map(({ dir }) => `\`${dir}\``).join(', '),
          '',
        ];
  return [
    `## ${title}`,
    '',
    headline,
    '',
    ...scriptsNote,
    ...runningBlock,
    ...skippedBlock,
  ].join('\n');
};
