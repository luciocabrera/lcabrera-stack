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
import { resolveHostRoot } from './host-root.mjs';

// Re-exported rather than moved out of reach: `CONFIG_FILE_NAME` is part of this
// package's published surface, and gates name the file in their own messages.
export { CONFIG_FILE_NAME };

/**
 * How a reader of a generated index is told to run these gates.
 *
 * Configuration rather than a constant, because the answer differs per
 * repository and an index naming the wrong one is a page instructing its reader
 * to run something that does not exist. `npx` is the default because it is the
 * one spelling that resolves wherever the package is installed — a bare bin name
 * does not, since `node_modules/.bin` is not on a plain shell's PATH. A
 * repository that drives everything through a task runner declares its own.
 */
export const DEFAULT_ADR_COMMANDS = {
  list: 'npx repo-verify-adrs --list',
  new: 'npx repo-adr',
  write: 'npx repo-verify-adrs --write',
};

/**
 * One home, because that is all a repository is assumed to have. A repository
 * that keeps a second — decisions internal to one app, say — declares both, and
 * the order it declares them in is the order they are reported.
 */
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
  // ninety of those belong.
  adrContentBaseline: 'scripts/adr-content-baseline.json',
  adrDraftDir: 'docs/agents/planning/adr-drafts',
  adrTemplateHome: 'docs/decisions',
  coordinationBoardDoc: 'docs/coordination/BOARD.md',
  coordinationTasksDir: 'docs/coordination/tasks',
};

export const DEFAULT_CONVENTIONS = {
  defaultBranch: 'main',
  sharedBranchesDir: 'docs/coordination/branches',
};

/**
 * `publicPackageDirs` has no useful default: the roster is the repository's own
 * data, and guessing it would point the gate at directories a consumer does not
 * have. Empty is therefore the honest default — and it is safe, because every
 * gate that reads it refuses to run on an empty roster rather than reporting a
 * clean pass over nothing.
 *
 * The rest default to the conventional layout, so a repository that follows it
 * configures nothing.
 */
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

/** A home needs somewhere to be and something to call itself; the rest is prose. */
const readableHome = (home) =>
  typeof home === 'object' &&
  home !== null &&
  typeof home.dir === 'string' &&
  home.dir.trim() !== '' &&
  typeof home.tier === 'string' &&
  home.tier.trim() !== '';

/**
 * A home writes ADRs, so its directory is held to the containment rule too, and
 * its tier is trimmed: the tier is a lookup key (`--home <tier>`), so a padded
 * one would validate and then match nothing.
 */
const containedHome = (home) => ({
  ...home,
  dir: repoRelative(home.dir, home.dir, 'registers.adrHomes[].dir'),
  tier: home.tier.trim(),
});

/**
 * Each command taken on its own, so a repository that declares one still gets a
 * working spelling for the two it did not — a half-declared block would
 * otherwise leave the rest naming nothing.
 */
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
    // Carried on every home, because the index renderer takes a home and
    // nothing else: a repository's own spelling has to reach it that way, or it
    // would have to be read from module state — and then anything rendering an
    // index for somewhere else would silently get this repository's.
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
  };
};

/**
 * The gates that measure a repository rather than describe it.
 *
 * `skipDirs` EXTENDS the scanner's built-in list rather than replacing it. A
 * consumer who declared their own and forgot `node_modules` would not get a
 * narrower gate; they would get one walking their whole dependency tree, which
 * reads as the gate being slow rather than misconfigured.
 *
 * `guideDoc` is empty by default because the pointer is the one part of a
 * finding that cannot be guessed — this repository sends readers to its script
 * rules, and a consumer's equivalent is named by them or by nobody.
 */
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
    // Which config filenames are decoys is a per-toolchain answer, never a
    // guessable one: `.prettierrc` is a decoy in a repository formatted by
    // something else and the live policy in a repository formatted by Prettier.
    // So the roster is empty by default and the gate refuses rather than
    // reporting a clean pass over a list it was never given — the same shape
    // `publishing.publicPackageDirs` takes.
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
    // `repoRoots` empty means "derive them from the tree" rather than "check
    // nothing" — the CLI reads the top-level directories instead. Every other
    // list here is an exemption, so empty is the strict end of the range and a
    // consumer who configures nothing gets the gate at its most demanding.
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
    // An empty roster stays empty: it is the signal every reader turns into a
    // loud failure, so replacing it with a default would hide the one state
    // that must not pass silently.
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

/**
 * The repository this package is installed in — not the working directory, so a
 * gate invoked from a subdirectory reads the same config as one invoked from
 * the root.
 */
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

/**
 * The coordination register's three locations, absolute, from one read of the
 * config. Every command that touches the register resolves them here rather
 * than joining its own — which is how the closer came to delete from
 * `docs/coordination/tasks` while reporting the configured path.
 *
 * The relative forms travel with them because they are what a message should
 * print: an absolute path inside a runner's checkout tells the reader nothing.
 */
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
