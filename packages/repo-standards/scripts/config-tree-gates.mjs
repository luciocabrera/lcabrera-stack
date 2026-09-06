/*
 * The rosters and file paths the tree-reading gates would otherwise hardcode:
 * the document a command gate checks, the allowance and roster files, the
 * baseline an inventory gate grandfathers into, where the coverage and analyser
 * reports are written, and which workspaces the coverage and probe gates visit.
 *
 * Split from `config.mjs` by size only; `readGates` returns both halves as one
 * block. The workspace rosters default to nothing, like `publicPackageDirs`:
 * a roster is the repository's own data, and each gate that reads one refuses
 * an empty roster rather than passing over no workspaces. A pattern roster is
 * held as regular-expression sources and compiled by its gate; this validates
 * that each one compiles, so a typo fails at read time rather than by matching
 * nothing.
 */

import {
  isPlainObject,
  patternList,
  readableString,
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
    ? value.filter(isWorkspaceEntry).map((entry) => ({
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
    ? value.filter(isTreeEntry).map((entry) => ({
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
    ? value
        .filter((entry) => typeof entry === 'string' && entry.trim() !== '')
        .map((entry) => repoRelative(entry, entry, `${key}[]`))
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
