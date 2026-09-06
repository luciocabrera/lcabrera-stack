/*
 * The repository facts these gates would otherwise hardcode.
 *
 * Same split the toolchain packages made: the rule travels, the names inside it
 * do not. A gate that says "retarget to `main`" is telling a repository with a
 * differently-named default branch something false, and one that names this
 * repository's register directory is naming a path a consumer does not have.
 *
 * The file is `devkit.config.json`, shared with the materialiser, because it is
 * the CONSUMER's data and two files invite drift between them. The readers are
 * separate on purpose: each package reads only the block it owns, so neither has
 * to depend on the other to answer a question about its own behaviour.
 */

import { existsSync, readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

import {
  CONFIG_FILE_NAME,
  containedList,
  isPlainObject,
  parseConfig,
  positiveInteger,
  readableString,
  repoRelative,
  verbatimList,
} from './config-values.mjs';
import { DEFAULT_TREE_GATES, resolveTreeGates } from './config-tree-gates.mjs';
import { resolveHostRoot } from './host-root.mjs';

// Re-exported rather than moved out of reach: `CONFIG_FILE_NAME` is part of this
// package's published surface, and gates name the file in their own messages.
export { CONFIG_FILE_NAME };

export const DEFAULT_ADR_COMMANDS = {
  list: 'npx repo-verify-adrs --list',
  new: 'npx repo-adr',
  write: 'npx repo-verify-adrs --write',
};

export const DEFAULT_REGISTERS = {
  adrCommands: DEFAULT_ADR_COMMANDS,
  // Empty for the same reason as `publicPackageDirs`: an overlap is the
  // repository's own history, and a default carrying one exempts numbers a
  // consumer never duplicated — which is a number the gate lets mean two things.
  adrGrandfatheredDuplicates: [],
  adrHomes: [
    {
      blurb: 'Architecture decisions for this repository.',
      dir: 'docs/decisions',
      tier: 'repo',
      title: 'Architecture decisions',
    },
  ],
  // Alongside the other two baselines rather than inside this file: it is a
  // list of the consumer's own filenames, and a register of policy is not where
  // a file list belongs.
  adrContentBaseline: 'scripts/adr-content-baseline.json',
  adrDraftDir: 'docs/agents/planning/adr-drafts',
  adrTemplateHome: 'docs/decisions',
  coordinationBoardDoc: 'docs/coordination/BOARD.md',
  coordinationTasksDir: 'docs/coordination/tasks',
  planningDir: 'docs/agents/planning',
  requirementsDir: 'docs/product/requirements',
};

export const DEFAULT_CONVENTIONS = {
  defaultBranch: 'main',
  sharedBranchesDir: 'docs/coordination/branches',
};

export const DEFAULT_PUBLISHING = {
  apiSurfaceDir: 'reports/api-surface',
  packagesDir: 'packages',
  publicPackageDirs: [],
  releaseWorkflow: '.github/workflows/release.yml',
  workspaceDirs: ['apps', 'packages'],
};

export const resolveConventions = (raw) => {
  if (raw === undefined) return DEFAULT_CONVENTIONS;
  const parsed = parseConfig(raw);
  const block = isPlainObject(parsed.conventions) ? parsed.conventions : {};
  return {
    defaultBranch: readableString(
      block.defaultBranch,
      DEFAULT_CONVENTIONS.defaultBranch,
    ),
    sharedBranchesDir: repoRelative(
      block.sharedBranchesDir,
      DEFAULT_CONVENTIONS.sharedBranchesDir,
      'conventions.sharedBranchesDir',
    ),
  };
};

const readableHome = (home) =>
  typeof home === 'object' &&
  home !== null &&
  typeof home.dir === 'string' &&
  home.dir.trim() !== '' &&
  typeof home.tier === 'string' &&
  home.tier.trim() !== '';

const containedHome = (home) => ({
  ...home,
  dir: repoRelative(home.dir, home.dir, 'registers.adrHomes[].dir'),
  tier: home.tier.trim(),
});

const resolveAdrCommands = (block) => {
  const declared = isPlainObject(block) ? block : {};
  return Object.fromEntries(
    Object.entries(DEFAULT_ADR_COMMANDS).map(([key, fallback]) => [
      key,
      readableString(declared[key], fallback),
    ]),
  );
};

export const resolveRegisters = (raw) => {
  if (raw === undefined) return DEFAULT_REGISTERS;
  const parsed = parseConfig(raw);
  const block = isPlainObject(parsed.registers) ? parsed.registers : {};
  const homes = Array.isArray(block.adrHomes)
    ? block.adrHomes.filter(readableHome).map(containedHome)
    : [];
  const adrCommands = resolveAdrCommands(block.adrCommands);
  const declaredHomes = homes.length > 0 ? homes : DEFAULT_REGISTERS.adrHomes;

  return {
    adrCommands,
    adrGrandfatheredDuplicates: Array.isArray(block.adrGrandfatheredDuplicates)
      ? block.adrGrandfatheredDuplicates.filter(
          (value) => Number.isInteger(value) && value > 0,
        )
      : DEFAULT_REGISTERS.adrGrandfatheredDuplicates,
    adrHomes: declaredHomes.map((home) => ({ ...home, commands: adrCommands })),
    adrContentBaseline: repoRelative(
      block.adrContentBaseline,
      DEFAULT_REGISTERS.adrContentBaseline,
      'registers.adrContentBaseline',
    ),
    adrDraftDir: repoRelative(
      block.adrDraftDir,
      DEFAULT_REGISTERS.adrDraftDir,
      'registers.adrDraftDir',
    ),
    adrTemplateHome: repoRelative(
      block.adrTemplateHome,
      DEFAULT_REGISTERS.adrTemplateHome,
      'registers.adrTemplateHome',
    ),
    coordinationBoardDoc: repoRelative(
      block.coordinationBoardDoc,
      DEFAULT_REGISTERS.coordinationBoardDoc,
      'registers.coordinationBoardDoc',
    ),
    coordinationTasksDir: repoRelative(
      block.coordinationTasksDir,
      DEFAULT_REGISTERS.coordinationTasksDir,
      'registers.coordinationTasksDir',
    ),
    planningDir: repoRelative(
      block.planningDir,
      DEFAULT_REGISTERS.planningDir,
      'registers.planningDir',
    ),
    requirementsDir: repoRelative(
      block.requirementsDir,
      DEFAULT_REGISTERS.requirementsDir,
      'registers.requirementsDir',
    ),
  };
};

export const DEFAULT_GATES = {
  scriptSize: {
    baselineFile: 'scripts/script-size-baseline.json',
    ceiling: 350,
    guideDoc: '',
    skipDirs: [],
  },
  strayConfigs: {
    configuredIn: '',
    skipDirs: [],
    unreadNames: [],
    unreadPrefixes: [],
  },
  docsPaths: {
    baselineFile: 'scripts/docs-paths-baseline.json',
    expectedAbsent: [],
    expectedAbsentPrefixes: [],
    ignoredDocs: [],
    onDemandReportDirs: [],
    repoRoots: [],
  },
  // The conventional monorepo layout, so a repository that follows it
  // configures nothing. Unlike the exemption lists above, this one is the
  // gate's REACH: an entry adds a directory whose name, seen inside an
  // installed document, is an instruction to open something the reader does not
  // have. Declaring it empty therefore falls back to this rather than switching
  // the check off — a roster nobody wrote is the one state that must not read
  // as a clean pass.
  shippedDocs: {
    repoOnlyDirs: ['apps', 'docs', 'packages', 'scripts'],
  },
  ...DEFAULT_TREE_GATES,
};

export const resolveGates = (raw) => {
  if (raw === undefined) return DEFAULT_GATES;
  const parsed = parseConfig(raw);
  const block = isPlainObject(parsed.gates) ? parsed.gates : {};
  const scriptSize = isPlainObject(block.scriptSize) ? block.scriptSize : {};
  const strayConfigs = isPlainObject(block.strayConfigs)
    ? block.strayConfigs
    : {};
  const docsPaths = isPlainObject(block.docsPaths) ? block.docsPaths : {};
  const shippedDocs = isPlainObject(block.shippedDocs) ? block.shippedDocs : {};

  return {
    scriptSize: {
      baselineFile: repoRelative(
        scriptSize.baselineFile,
        DEFAULT_GATES.scriptSize.baselineFile,
        'gates.scriptSize.baselineFile',
      ),
      ceiling: positiveInteger(
        scriptSize.ceiling,
        DEFAULT_GATES.scriptSize.ceiling,
        'gates.scriptSize.ceiling',
      ),
      guideDoc: readableString(
        scriptSize.guideDoc,
        DEFAULT_GATES.scriptSize.guideDoc,
      ),
      skipDirs: verbatimList(
        scriptSize.skipDirs,
        DEFAULT_GATES.scriptSize.skipDirs,
      ),
    },
    strayConfigs: {
      configuredIn: readableString(
        strayConfigs.configuredIn,
        DEFAULT_GATES.strayConfigs.configuredIn,
      ),
      skipDirs: verbatimList(
        strayConfigs.skipDirs,
        DEFAULT_GATES.strayConfigs.skipDirs,
      ),
      unreadNames: verbatimList(
        strayConfigs.unreadNames,
        DEFAULT_GATES.strayConfigs.unreadNames,
      ),
      unreadPrefixes: verbatimList(
        strayConfigs.unreadPrefixes,
        DEFAULT_GATES.strayConfigs.unreadPrefixes,
      ),
    },
    docsPaths: {
      baselineFile: repoRelative(
        docsPaths.baselineFile,
        DEFAULT_GATES.docsPaths.baselineFile,
        'gates.docsPaths.baselineFile',
      ),
      expectedAbsent: containedList(
        docsPaths.expectedAbsent,
        DEFAULT_GATES.docsPaths.expectedAbsent,
        'gates.docsPaths.expectedAbsent[]',
      ),
      expectedAbsentPrefixes: verbatimList(
        docsPaths.expectedAbsentPrefixes,
        DEFAULT_GATES.docsPaths.expectedAbsentPrefixes,
      ),
      ignoredDocs: verbatimList(
        docsPaths.ignoredDocs,
        DEFAULT_GATES.docsPaths.ignoredDocs,
      ),
      onDemandReportDirs: containedList(
        docsPaths.onDemandReportDirs,
        DEFAULT_GATES.docsPaths.onDemandReportDirs,
        'gates.docsPaths.onDemandReportDirs[]',
      ),
      repoRoots: verbatimList(
        docsPaths.repoRoots,
        DEFAULT_GATES.docsPaths.repoRoots,
      ),
    },
    shippedDocs: {
      repoOnlyDirs: verbatimList(
        shippedDocs.repoOnlyDirs,
        DEFAULT_GATES.shippedDocs.repoOnlyDirs,
      ),
    },
    ...resolveTreeGates(block),
  };
};

export const resolvePublishing = (raw) => {
  if (raw === undefined) return DEFAULT_PUBLISHING;
  const parsed = parseConfig(raw);
  const block = isPlainObject(parsed.publishing) ? parsed.publishing : {};

  return {
    apiSurfaceDir: repoRelative(
      block.apiSurfaceDir,
      DEFAULT_PUBLISHING.apiSurfaceDir,
      'publishing.apiSurfaceDir',
    ),
    packagesDir: repoRelative(
      block.packagesDir,
      DEFAULT_PUBLISHING.packagesDir,
      'publishing.packagesDir',
    ),
    publicPackageDirs: containedList(
      block.publicPackageDirs,
      DEFAULT_PUBLISHING.publicPackageDirs,
      'publishing.publicPackageDirs[]',
    ),
    releaseWorkflow: repoRelative(
      block.releaseWorkflow,
      DEFAULT_PUBLISHING.releaseWorkflow,
      'publishing.releaseWorkflow',
    ),
    workspaceDirs: containedList(
      block.workspaceDirs,
      DEFAULT_PUBLISHING.workspaceDirs,
      'publishing.workspaceDirs[]',
    ),
  };
};

const hostRoot = () =>
  resolveHostRoot({ moduleDirectory: dirname(fileURLToPath(import.meta.url)) });

const readRaw = (root) => {
  const path = join(root, CONFIG_FILE_NAME);
  return existsSync(path) ? readFileSync(path, 'utf8') : undefined;
};

export const readConventions = (root = hostRoot()) =>
  resolveConventions(readRaw(root));

export const readRegisters = (root = hostRoot()) =>
  resolveRegisters(readRaw(root));

export const readPublishing = (root = hostRoot()) =>
  resolvePublishing(readRaw(root));

export const readGates = (root = hostRoot()) => resolveGates(readRaw(root));

export const readCoordinationPaths = (root = hostRoot()) => {
  const raw = readRaw(root);
  const { coordinationBoardDoc, coordinationTasksDir } = resolveRegisters(raw);
  const { sharedBranchesDir } = resolveConventions(raw);

  return {
    boardDoc: join(root, coordinationBoardDoc),
    boardRel: coordinationBoardDoc,
    branchesDir: join(root, sharedBranchesDir),
    branchesRel: sharedBranchesDir,
    tasksDir: join(root, coordinationTasksDir),
    tasksRel: coordinationTasksDir,
  };
};
