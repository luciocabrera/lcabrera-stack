/**
 * Turns a list of changed files into the exact `vp run` test groups needed to
 * cover them — the brain behind `vp run test:changed`. A change to one workspace
 * must also re-test every workspace that DEPENDS on it (a library edit can break
 * the application that imports it), so this walks the workspace dependency graph
 * (built from each package.json's `workspace:*` deps) to add transitive
 * dependents. Only the few files that change how every workspace resolves its
 * tests — the lockfile, the workspace manifest, the root Vite+ config, and the
 * shared config packages `gates.affectedTests.globalPackages` names — force the
 * FULL suite. Which packages those are is the repository's own data, so an
 * empty roster is refused: selecting a scoped run where the full one was due
 * leaves the dependents untested and reports a plausible subset. Every other
 * file outside a workspace selects no workspace, only the root suites below. `gates.affectedTests.lintOnlyPatterns` is the opposite case
 * — a file matching one is dropped before selection because the linters gate it
 * on every pull request anyway, so an empty list only ever over-selects and is
 * accepted.
 *
 * A root suite (`gates.affectedTests.rootSuites`) is a test task that lives in
 * no workspace, so no workspace selection reaches it: each one names the task
 * and the path patterns of every file whose change can fail it, and a changed
 * file matching any of them adds that task as its own group. It is matched
 * before the lint-only drop, because the linters passing says nothing about a
 * suite that reads the file. Left unset, the one root suite is `test:scripts`
 * over the code under `scripts/`.
 *
 * The per-workspace task substitution mirrors `test:ci` exactly so the two never
 * diverge: in CI mode the configured coverage workspace
 * (`gates.affectedTests.coverageTaskPackage`) runs its coverage `test:ci` last. A
 * FULL run is just "every workspace is affected", so it reproduces `test:ci` by
 * construction.
 *
 * No workspace here needs a real Postgres, so there is no DB-free `test:unit`
 * substitution — `test:ci` in the root manifest is the shape to mirror if one
 * is ever needed.
 *
 * Effectful only in `readWorkspaceGraph` (reads package.json files); the rest is
 * pure and drives the runner in `./test-changed.mjs`. See
 * `.claude/rules/scripts.md`.
 */
import { readFileSync } from 'node:fs';
import { join } from 'node:path';

import { deriveWorkspaces, workspacesForFiles } from './workspace-scopes.mjs';

const FORCE_FULL_PATTERNS = [
  /^pnpm-lock\.yaml$/,
  /^pnpm-workspace\.yaml$/,
  /^vite\.config\.ts$/,
];

const forcesFullRun = (files) =>
  files.some((file) =>
    FORCE_FULL_PATTERNS.some((pattern) => pattern.test(file)),
  );

const compiledPatterns = (sources) =>
  sources.map((source) => new RegExp(source, 'u'));

const matchesAny = (file, patterns) =>
  patterns.some((pattern) => pattern.test(file));

const selectedSuites = (files, rootSuites) =>
  rootSuites
    .filter((suite) => {
      const patterns = compiledPatterns(suite.patterns);
      return files.some((file) => matchesAny(file, patterns));
    })
    .map((suite) => suite.task);

const workspaceDeps = (manifest, packageNames) => {
  const all = {
    ...manifest.dependencies,
    ...manifest.devDependencies,
    ...manifest.peerDependencies,
  };
  return new Set(Object.keys(all).filter((name) => packageNames.has(name)));
};

export const readWorkspaceGraph = (repoRoot) => {
  const located = deriveWorkspaces(repoRoot).map((workspace) => {
    const dir = `${workspace.kind === 'app' ? 'apps' : 'packages'}/${workspace.name}`;
    const manifest = JSON.parse(
      readFileSync(join(repoRoot, dir, 'package.json'), 'utf8'),
    );
    return { ...workspace, dir, manifest, pkgName: manifest.name };
  });
  const packageNames = new Set(located.map((workspace) => workspace.pkgName));
  return located.map((workspace) => ({
    deps: workspaceDeps(workspace.manifest, packageNames),
    dir: workspace.dir,
    kind: workspace.kind,
    name: workspace.name,
    pkgName: workspace.pkgName,
  }));
};

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

export const withDependents = (seeds, dependents) => {
  const affected = new Set(seeds);
  const worklist = [...seeds];
  while (worklist.length > 0) {
    const pkg = worklist.pop();
    const downstream = [...(dependents.get(pkg) ?? [])];
    const fresh = downstream.filter((dependent) => !affected.has(dependent));
    for (const dependent of fresh) {
      affected.add(dependent);
      worklist.push(dependent);
    }
  }
  return affected;
};

export const partitionTasks = (
  affectedPackages,
  { ci = false, coverageTaskPackage } = {},
) => {
  const affected = new Set(affectedPackages);
  const useCoverage = ci && affected.has(coverageTaskPackage);
  const plain = [...affected].filter(
    (pkg) => !useCoverage || pkg !== coverageTaskPackage,
  );
  return [
    { packages: plain, task: 'test' },
    ...(useCoverage
      ? [{ packages: [coverageTaskPackage], task: 'test:ci' }]
      : []),
  ].filter((group) => group.packages.length > 0);
};

export const resolveAffected = ({
  files,
  globalPackages,
  graph,
  lintOnlyPatterns = [],
  rootSuites = [],
}) => {
  if (globalPackages === undefined || globalPackages.length === 0) {
    throw new Error(
      '`gates.affectedTests.globalPackages` names no package in devkit.config.json — refusing to select tests, because a change to a shared config package would then be scoped and its dependents would go untested.',
    );
  }
  const lintOnly = compiledPatterns(lintOnlyPatterns);
  const global = new Set(globalPackages);
  const relevant = files.filter((file) => !matchesAny(file, lintOnly));
  const suites = selectedSuites(files, rootSuites);
  if (relevant.length === 0) {
    return { changed: [], mode: 'none', packages: [], suites };
  }
  const changedWorkspaces = workspacesForFiles(relevant, graph);
  const changed = changedWorkspaces.map((workspace) => workspace.pkgName);
  const forceFull =
    forcesFullRun(relevant) ||
    changedWorkspaces.some((workspace) => global.has(workspace.pkgName));
  if (forceFull) {
    return {
      changed,
      mode: 'full',
      packages: graph.map((workspace) => workspace.pkgName),
      suites,
    };
  }
  if (changed.length === 0) {
    return { changed: [], mode: 'none', packages: [], suites };
  }
  const affected = withDependents(changed, buildDependents(graph));
  return { changed, mode: 'scoped', packages: [...affected], suites };
};

export const resolveTestGroups = ({
  ci = false,
  coverageTaskPackage,
  files,
  globalPackages,
  graph,
  lintOnlyPatterns,
  rootSuites,
}) => {
  const { changed, mode, packages, suites } = resolveAffected({
    files,
    globalPackages,
    graph,
    lintOnlyPatterns,
    rootSuites,
  });
  const groups = [
    ...partitionTasks(packages, { ci, coverageTaskPackage }),
    ...suites.map((task) => ({ packages: [], task })),
  ];
  return { changed, groups, mode, packages, suites };
};

const dispositionReason = (running, isChanged) => {
  if (!running) {
    return 'no changes detected';
  }
  return isChanged ? 'changed' : 'depends on a changed package';
};

export const workspaceDispositions = ({ affected, changed, graph, groups }) => {
  const affectedSet = new Set(affected);
  const changedSet = new Set(changed);
  const taskByPackage = new Map(
    groups.flatMap((group) => group.packages.map((pkg) => [pkg, group.task])),
  );
  return graph.map((workspace) => {
    const isRunning = affectedSet.has(workspace.pkgName);
    return {
      dir: workspace.dir,
      pkgName: workspace.pkgName,
      reason: dispositionReason(isRunning, changedSet.has(workspace.pkgName)),
      running: isRunning,
      task: taskByPackage.get(workspace.pkgName),
    };
  });
};

const codeSpan = (text) => `\`${text}\``;

export const renderSelectionMarkdown = (
  mode,
  dispositions,
  { suites = [], title = '🧪 Test Selection' } = {},
) => {
  const running = dispositions.filter((disposition) => disposition.running);
  const skipped = dispositions.filter((disposition) => !disposition.running);
  const total = dispositions.length;
  const headline =
    mode === 'full'
      ? `**Full run** — a shared or root file changed, so all ${total} workspaces run.`
      : `**${running.length} of ${total} workspaces** affected by this change; the rest are skipped (no changes detected).`;
  const suitesNote =
    suites.length === 0
      ? []
      : [
          `> Plus ${suites.map((task) => codeSpan(task)).join(', ')} — a file a root suite reads changed.`,
          '',
        ];
  const runningBlock =
    running.length === 0
      ? []
      : [
          '### ▶ Running',
          '',
          '| Workspace | Task | Why |',
          '| --- | --- | --- |',
          ...running.map(
            ({ dir, reason, task }) =>
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
    ...suitesNote,
    ...runningBlock,
    ...skippedBlock,
  ].join('\n');
};
