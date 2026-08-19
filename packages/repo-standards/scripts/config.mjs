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
import { dirname, join, posix } from 'node:path';
import { fileURLToPath } from 'node:url';

import { errorMessage } from './error-message.mjs';
import { resolveHostRoot } from './host-root.mjs';

export const CONFIG_FILE_NAME = 'devkit.config.json';

/**
 * One home, because that is all a repository is assumed to have. A repository
 * that keeps a second — decisions internal to one app, say — declares both, and
 * the order it declares them in is the order they are reported.
 */
export const DEFAULT_REGISTERS = {
  adrHomes: [
    {
      blurb: 'Architecture decisions for this repository.',
      dir: 'docs/decisions',
      tier: 'repo',
      title: 'Architecture decisions',
    },
  ],
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

const isPlainObject = (value) =>
  typeof value === 'object' && value !== null && !Array.isArray(value);

/** An empty string is a mistake, not an override — it would resolve to the host root. */
const readableString = (value, fallback) =>
  typeof value === 'string' && value.trim() !== '' ? value.trim() : fallback;

/**
 * A configured location that leaves the repository is refused by name rather
 * than normalised into something harmless.
 *
 * These gates write and delete: the ADR scaffolder writes a file, the index
 * regenerates one, the board is overwritten and the claim closer unlinks. A
 * value like `../../etc` survives `join` — it does not "resolve to nothing", it
 * resolves OUTSIDE the host root — and an absolute one silently becomes a
 * subdirectory of it, so a consumer who wrote `/var/claims` would find their
 * claims under `<root>/var/claims` and no error saying why.
 */
/**
 * One spelling per location, because these values are compared as strings, not
 * only joined onto a root: the ADR gate decides whether a file is a stray by
 * asking whether its directory is in the set of configured homes. Declare that
 * home as `docs/decisions/` rather than `docs/decisions` and every ADR in it is
 * reported as a stray — from a trailing slash.
 */
/**
 * Parsed with POSIX semantics on every platform, because the value is checked
 * into git and read wherever the gate runs — a verdict that depends on the
 * host's separator is not a verdict.
 *
 * The platform `normalize` is what makes that a real hazard rather than a
 * tidiness point: on Windows it turns `../../etc` into `..\..\etc`, which the
 * segment check below (splitting on `/`) then reads as a single ordinary name.
 * The containment check would pass and the escape would go through.
 */
const slashed = (value) => value.replaceAll('\\', '/');

const canonical = (value) => {
  // `normalize` has already collapsed any run of separators, so at most one
  // trailing slash can be left — stripped by hand because the regex that does
  // it rescans from every offset (Sonar S8786).
  const normalised = posix.normalize(slashed(value));
  const trimmed = normalised.endsWith('/')
    ? normalised.slice(0, -1)
    : normalised;
  return trimmed === '' ? '.' : trimmed;
};

/** `C:` and `\\server` are roots too, on whichever platform reads the config. */
const DRIVE_OR_UNC = /^(?:[a-z]:|\/\/)/i;

const isRooted = (value) => {
  const withSlashes = slashed(value);
  return posix.isAbsolute(withSlashes) || DRIVE_OR_UNC.test(withSlashes);
};

/** `..` climbs only as a whole segment — `..data` is a name, not a parent. */
const leavesRoot = (candidate) => candidate.split('/')[0] === '..';

const repoRelative = (value, fallback, key) => {
  const raw = readableString(value, fallback);
  if (isRooted(raw)) {
    throw new Error(
      `${CONFIG_FILE_NAME}: \`${key}\` must be relative to the repository root, but is \`${raw}\`.`,
    );
  }
  const candidate = canonical(raw);
  if (leavesRoot(candidate)) {
    throw new Error(
      `${CONFIG_FILE_NAME}: \`${key}\` must stay inside the repository, but \`${raw}\` leaves it.`,
    );
  }
  return candidate;
};

/**
 * The config as an object, or a failure that names the file.
 *
 * A malformed config is a failure rather than a silent fallback: a consumer who
 * wrote one meant it, and quietly ignoring it would enforce a rule they did not
 * ask for while reporting success. `JSON.parse` says what is wrong but not what
 * it was reading, and the gates print a single line — so its message alone
 * leaves a reader with nothing to open.
 */
const parseConfig = (raw) => {
  let parsed;
  try {
    parsed = JSON.parse(raw);
  } catch (error) {
    throw new Error(
      `${CONFIG_FILE_NAME} is not valid JSON: ${errorMessage(error)}`,
    );
  }
  if (!isPlainObject(parsed)) {
    throw new Error(`${CONFIG_FILE_NAME} must contain a JSON object`);
  }
  return parsed;
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

export const resolveRegisters = (raw) => {
  if (raw === undefined) return DEFAULT_REGISTERS;
  const parsed = parseConfig(raw);
  const block = isPlainObject(parsed.registers) ? parsed.registers : {};
  const homes = Array.isArray(block.adrHomes)
    ? block.adrHomes.filter(readableHome).map(containedHome)
    : [];
  return {
    adrHomes: homes.length > 0 ? homes : DEFAULT_REGISTERS.adrHomes,
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

/** Every entry held to the containment rule, in the order it was declared. */
const containedList = (value, fallback, key) => {
  if (!Array.isArray(value)) return fallback;
  const entries = value
    .filter((entry) => typeof entry === 'string' && entry.trim() !== '')
    .map((entry) => repoRelative(entry, entry, key));
  return entries.length > 0 ? entries : fallback;
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
