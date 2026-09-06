/**
 * Turns a list of changed files into the exact `vp run` test groups needed to
 * cover them — the brain behind `vp run test:changed`. A change to one workspace
 * must also re-test every workspace that DEPENDS on it (a library edit can break
 * the application that imports it), so this walks the workspace dependency graph
 * (built from each package.json's `workspace:*` deps) to add transitive
 * dependents. Only the few files that change how every workspace resolves its
 * tests — the lockfile, the workspace manifest, the root Vite+ config, and the
 * shared config packages `GLOBAL_PACKAGES` names below — force the FULL suite;
 * every other out-of-workspace file (root package.json scripts, docs, tooling)
 * affects no suite and is ignored. Lint/format-only configs (the `vite-configs`
 * eslint/oxlint/oxfmt factories, any `eslint.config.mjs`) are dropped before
 * selection and force nothing — the linters gate them on every PR regardless
 * (see `LINT_ONLY_PATTERNS`).
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

const GLOBAL_PACKAGES = new Set([
  '@lcabrera/tsconfig',
  '@repo/ts-configs',
  '@lcabrera/vite-config',
]);

const FORCE_FULL_PATTERNS = [
  /^pnpm-lock\.yaml$/,
  /^pnpm-workspace\.yaml$/,
  /^vite\.config\.ts$/,
];

const forcesFullRun = (files) =>
  files.some((file) =>
    FORCE_FULL_PATTERNS.some((pattern) => pattern.test(file)),
  );

const LINT_ONLY_PATTERNS = [
  /^packages\/vite-configs\/eslint\./,
  /^packages\/vite-configs\/vite\.(lint|fmt)\.shared\.config\.ts$/,
  /(^|\/)eslint\.config\.mjs$/,
];

const isLintOnly = (file) =>
  LINT_ONLY_PATTERNS.some((pattern) => pattern.test(file));

export const SCRIPTS_TEST_TASK = 'test:scripts';

const SCRIPTS_TEST_PATTERN = /^scripts\/.+\.(mjs|cjs|js)$/;

const touchesScripts = (files) =>
  files.some((file) => SCRIPTS_TEST_PATTERN.test(file));

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
    for (const dependent of dependents.get(pkg) ?? []) {
      if (!affected.has(dependent)) {
        affected.add(dependent);
        worklist.push(dependent);
      }
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
    { task: 'test', packages: plain },
    ...(useCoverage
      ? [{ task: 'test:ci', packages: [coverageTaskPackage] }]
      : []),
  ].filter((group) => group.packages.length > 0);
};

export const resolveAffected = ({ files, graph }) => {
  const relevant = files.filter((file) => !isLintOnly(file));
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

export const resolveTestGroups = ({
  files,
  graph,
  ci = false,
  coverageTaskPackage,
}) => {
  const { mode, packages, changed, scripts } = resolveAffected({
    files,
    graph,
  });
  const groups = partitionTasks(packages, { ci, coverageTaskPackage });
  if (scripts) {
    groups.push({ task: SCRIPTS_TEST_TASK, packages: [] });
  }
  return { mode, packages, changed, scripts, groups };
};

const dispositionReason = (running, isChanged) => {
  if (!running) {
    return 'no changes detected';
  }
  return isChanged ? 'changed' : 'depends on a changed package';
};

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
