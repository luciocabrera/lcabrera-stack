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
  adrTemplateHome: 'docs/decisions',
  coordinationBoardDoc: 'docs/coordination/BOARD.md',
  coordinationTasksDir: 'docs/coordination/tasks',
};

export const DEFAULT_CONVENTIONS = {
  defaultBranch: 'main',
  sharedBranchesDir: 'docs/coordination/branches',
};

const isPlainObject = (value) =>
  typeof value === 'object' && value !== null && !Array.isArray(value);

/** An empty string is a mistake, not an override — it would resolve to the host root. */
const readableString = (value, fallback) =>
  typeof value === 'string' && value !== '' ? value : fallback;

/**
 * A malformed config is a failure rather than a silent fallback: a consumer who
 * wrote one meant it, and quietly ignoring it would enforce a rule they did not
 * ask for while reporting success.
 */
export const resolveConventions = (raw) => {
  if (raw === undefined) return DEFAULT_CONVENTIONS;
  const parsed = JSON.parse(raw);
  if (!isPlainObject(parsed)) {
    throw new Error(`${CONFIG_FILE_NAME} must contain a JSON object`);
  }
  const block = isPlainObject(parsed.conventions) ? parsed.conventions : {};
  return {
    defaultBranch: readableString(
      block.defaultBranch,
      DEFAULT_CONVENTIONS.defaultBranch,
    ),
    sharedBranchesDir: readableString(
      block.sharedBranchesDir,
      DEFAULT_CONVENTIONS.sharedBranchesDir,
    ),
  };
};

/** A home needs somewhere to be and something to call itself; the rest is prose. */
const readableHome = (home) =>
  typeof home === 'object' &&
  home !== null &&
  typeof home.dir === 'string' &&
  home.dir !== '' &&
  typeof home.tier === 'string' &&
  home.tier !== '';

export const resolveRegisters = (raw) => {
  if (raw === undefined) return DEFAULT_REGISTERS;
  const parsed = JSON.parse(raw);
  if (!isPlainObject(parsed)) {
    throw new Error(`${CONFIG_FILE_NAME} must contain a JSON object`);
  }
  const block = isPlainObject(parsed.registers) ? parsed.registers : {};
  const homes = Array.isArray(block.adrHomes)
    ? block.adrHomes.filter(readableHome)
    : [];
  return {
    adrHomes: homes.length > 0 ? homes : DEFAULT_REGISTERS.adrHomes,
    adrTemplateHome: readableString(
      block.adrTemplateHome,
      DEFAULT_REGISTERS.adrTemplateHome,
    ),
    coordinationBoardDoc: readableString(
      block.coordinationBoardDoc,
      DEFAULT_REGISTERS.coordinationBoardDoc,
    ),
    coordinationTasksDir: readableString(
      block.coordinationTasksDir,
      DEFAULT_REGISTERS.coordinationTasksDir,
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

/**
 * The coordination register's three locations, absolute, from one read of the
 * config. Both commands that touch the register resolve them here rather than
 * each joining its own — which is how the closer came to delete from
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
