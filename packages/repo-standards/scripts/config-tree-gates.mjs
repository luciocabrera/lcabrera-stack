/*
 * The rosters and file paths the tree-reading gates would otherwise hardcode:
 * the document a command gate checks, the allowance and roster files, the
 * baseline an inventory gate grandfathers into, where the coverage and analyser
 * reports are written, and which workspaces the coverage and probe gates visit.
 *
 * Split from `config.mjs` by size only; `readGates` returns both halves as one
 * block. The workspace rosters default to nothing, like `publicPackageDirs`:
 * a roster is the repository's own data, and each gate that reads one refuses
 * an empty roster rather than passing over no workspaces.
 *
 * A malformed ENTRY is refused too, not dropped. A roster one short still runs,
 * still exits 0 and still prints a count nobody reads, which is how a package
 * went missing from a report for the life of a release; the empty-roster guards
 * downstream only catch the all-or-nothing case. So a typo in an entry throws
 * naming the key, as an escaping path and an uncompilable pattern already do.
 */

import {
  isPlainObject,
  patternList,
  readableString,
  rejectMalformed,
  repoRelative,
  verbatimList,
} from './config-values.mjs';

export const DEFAULT_TREE_GATES = {
  affectedTests: {
    coverageTaskPackage: '',
    globalPackages: [],
    lintOnlyPatterns: [],
  },
  commandsDoc: { file: 'COMMANDS.md' },
  coverage: {
    mergeWorkspaces: [],
    mergedFile: 'reports/fallow/coverage/coverage-final.json',
    reportWorkspaces: [],
    summaryFile: 'coverage/monorepo-coverage-summary.json',
  },
  departedNames: { rosterFile: 'scripts/departed-names.json' },
  depsAudit: { allowanceFile: 'docs/agents/dependency-advisories.json' },
  eslintPass: { probeWorkspaces: [] },
  inventory: {
    baselineFile: 'scripts/inventory-drift-baseline.json',
    trees: [],
  },
  lintReport: { reportsDir: 'reports' },
  reactDoctor: { reportFile: 'reports/react-doctor/full-latest.json' },
  usageReport: { outDir: 'reports/usage' },
  vitePlusBlock: { agentDoc: 'AGENTS.md' },
};

const blockOf = (parent, key) =>
  isPlainObject(parent[key]) ? parent[key] : {};

const isWorkspaceEntry = (entry) =>
  isPlainObject(entry) &&
  typeof entry.dir === 'string' &&
  entry.dir.trim() !== '' &&
  typeof entry.name === 'string' &&
  entry.name.trim() !== '';

const workspaceList = (value, fallback, key) =>
  Array.isArray(value)
    ? rejectMalformed({
        entries: value,
        isValid: isWorkspaceEntry,
        key,
        requirement: 'must name a `dir` and a `name`',
      }).map((entry) => ({
        dir: repoRelative(entry.dir, entry.dir, `${key}[].dir`),
        name: entry.name.trim(),
        ...(typeof entry.run === 'boolean' ? { run: entry.run } : {}),
      }))
    : fallback;

const isTreeEntry = (entry) =>
  isPlainObject(entry) &&
  typeof entry.inventory === 'string' &&
  entry.inventory.trim() !== '' &&
  typeof entry.root === 'string' &&
  entry.root.trim() !== '';

const treeList = (value, fallback, key) =>
  Array.isArray(value)
    ? rejectMalformed({
        entries: value,
        isValid: isTreeEntry,
        key,
        requirement: 'must name a `root` and an `inventory`',
      }).map((entry) => ({
        inventory: repoRelative(
          entry.inventory,
          entry.inventory,
          `${key}[].inventory`,
        ),
        root: repoRelative(entry.root, entry.root, `${key}[].root`),
      }))
    : fallback;

const pathList = (value, fallback, key) =>
  Array.isArray(value)
    ? rejectMalformed({
        entries: value,
        isValid: (entry) => typeof entry === 'string' && entry.trim() !== '',
        key,
        requirement: 'must be a non-empty string',
      }).map((entry) => repoRelative(entry, entry, `${key}[]`))
    : fallback;

const resolvePath = (block, key, fallback, name) =>
  repoRelative(block[key], fallback, name);

export const resolveTreeGates = (gates) => {
  const defaults = DEFAULT_TREE_GATES;
  const affectedTests = blockOf(gates, 'affectedTests');
  const commandsDoc = blockOf(gates, 'commandsDoc');
  const coverage = blockOf(gates, 'coverage');
  const departedNames = blockOf(gates, 'departedNames');
  const depsAudit = blockOf(gates, 'depsAudit');
  const eslintPass = blockOf(gates, 'eslintPass');
  const inventory = blockOf(gates, 'inventory');
  const lintReport = blockOf(gates, 'lintReport');
  const reactDoctor = blockOf(gates, 'reactDoctor');
  const usageReport = blockOf(gates, 'usageReport');
  const vitePlusBlock = blockOf(gates, 'vitePlusBlock');

  return {
    affectedTests: {
      coverageTaskPackage: readableString(
        affectedTests.coverageTaskPackage,
        defaults.affectedTests.coverageTaskPackage,
      ),
      globalPackages: verbatimList(
        affectedTests.globalPackages,
        defaults.affectedTests.globalPackages,
        'gates.affectedTests.globalPackages[]',
      ),
      lintOnlyPatterns: patternList(
        affectedTests.lintOnlyPatterns,
        defaults.affectedTests.lintOnlyPatterns,
        'gates.affectedTests.lintOnlyPatterns',
      ),
    },
    commandsDoc: {
      file: resolvePath(
        commandsDoc,
        'file',
        defaults.commandsDoc.file,
        'gates.commandsDoc.file',
      ),
    },
    coverage: {
      mergeWorkspaces: workspaceList(
        coverage.mergeWorkspaces,
        defaults.coverage.mergeWorkspaces,
        'gates.coverage.mergeWorkspaces',
      ),
      mergedFile: resolvePath(
        coverage,
        'mergedFile',
        defaults.coverage.mergedFile,
        'gates.coverage.mergedFile',
      ),
      reportWorkspaces: workspaceList(
        coverage.reportWorkspaces,
        defaults.coverage.reportWorkspaces,
        'gates.coverage.reportWorkspaces',
      ),
      summaryFile: resolvePath(
        coverage,
        'summaryFile',
        defaults.coverage.summaryFile,
        'gates.coverage.summaryFile',
      ),
    },
    departedNames: {
      rosterFile: resolvePath(
        departedNames,
        'rosterFile',
        defaults.departedNames.rosterFile,
        'gates.departedNames.rosterFile',
      ),
    },
    depsAudit: {
      allowanceFile: resolvePath(
        depsAudit,
        'allowanceFile',
        defaults.depsAudit.allowanceFile,
        'gates.depsAudit.allowanceFile',
      ),
    },
    eslintPass: {
      probeWorkspaces: pathList(
        eslintPass.probeWorkspaces,
        defaults.eslintPass.probeWorkspaces,
        'gates.eslintPass.probeWorkspaces',
      ),
    },
    inventory: {
      baselineFile: resolvePath(
        inventory,
        'baselineFile',
        defaults.inventory.baselineFile,
        'gates.inventory.baselineFile',
      ),
      trees: treeList(
        inventory.trees,
        defaults.inventory.trees,
        'gates.inventory.trees',
      ),
    },
    lintReport: {
      reportsDir: resolvePath(
        lintReport,
        'reportsDir',
        defaults.lintReport.reportsDir,
        'gates.lintReport.reportsDir',
      ),
    },
    reactDoctor: {
      reportFile: resolvePath(
        reactDoctor,
        'reportFile',
        defaults.reactDoctor.reportFile,
        'gates.reactDoctor.reportFile',
      ),
    },
    usageReport: {
      outDir: resolvePath(
        usageReport,
        'outDir',
        defaults.usageReport.outDir,
        'gates.usageReport.outDir',
      ),
    },
    vitePlusBlock: {
      agentDoc: resolvePath(
        vitePlusBlock,
        'agentDoc',
        defaults.vitePlusBlock.agentDoc,
        'gates.vitePlusBlock.agentDoc',
      ),
    },
  };
};
