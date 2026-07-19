/**
 * Turns a list of changed files into the exact `vp run` test groups needed to
 * cover them — the brain behind `vp run test:changed`. A change to one workspace
 * must also re-test every workspace that DEPENDS on it (a `packages/ui` edit can
 * break `apps/react-router`), so this walks the workspace dependency graph
 * (built from each package.json's `workspace:*` deps) to add transitive
 * dependents. Anything that could affect every workspace at once — a root config,
 * the lockfile, the shared `vite-configs`/`ts-configs` — forces the FULL suite,
 * because guessing narrow there would silently skip real breakage.
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
 * Out-of-workspace paths that never change a test's outcome, so a diff touching
 * only these runs nothing. Everything else outside a workspace is treated as a
 * global change (full run) — conservative on purpose.
 */
const INERT_PATTERNS = [
  /^[^/]+\.md$/,
  /^docs\//,
  /^\.claude\//,
  /^\.github\//,
  /^\.vscode\//,
  /^reports\//,
  /^\.gitignore$/,
  /^\.env\.example$/,
  /^LICENSE$/,
];

const isInWorkspace = (file) =>
  /^apps\/[^/]+\//.test(file) || /^packages\/[^/]+\//.test(file);

const isInert = (file) => INERT_PATTERNS.some((pattern) => pattern.test(file));

/**
 * True when the diff touches a file outside every workspace that is not on the
 * inert allowlist (a root config, the lockfile, a new top-level file, …).
 */
const hasGlobalChange = (files) =>
  files.some((file) => !isInWorkspace(file) && !isInert(file));

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
 * The plan for a diff: `{ mode, groups }`, where mode is `none` (nothing to run),
 * `full` (root/shared change → every workspace), or `scoped` (changed workspaces
 * plus their dependents). `groups` are ready to hand to `vp run`.
 */
export const resolveTestGroups = ({ files, graph, ci = false }) => {
  if (files.length === 0) {
    return { mode: 'none', groups: [] };
  }
  const changed = workspacesForFiles(files, graph);
  const forceFull =
    hasGlobalChange(files) ||
    changed.some((workspace) => GLOBAL_PACKAGES.has(workspace.pkgName));
  if (forceFull) {
    const all = graph.map((workspace) => workspace.pkgName);
    return { mode: 'full', groups: partitionTasks(all, { ci }) };
  }
  if (changed.length === 0) {
    return { mode: 'none', groups: [] };
  }
  const dependents = buildDependents(graph);
  const affected = withDependents(
    changed.map((workspace) => workspace.pkgName),
    dependents,
  );
  return { mode: 'scoped', groups: partitionTasks([...affected], { ci }) };
};
