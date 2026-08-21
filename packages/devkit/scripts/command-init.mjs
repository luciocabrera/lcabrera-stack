/*
 * The `init` command: the filesystem half.
 *
 * Every judgement it makes comes from `init.mjs`, so this file is the reading,
 * the writing and the exit code. It ends by going through the same `buildPlan`
 * that `sync` and `doctor` use rather than materialising by its own route — an
 * init that placed files a later `doctor` would not recognise would leave a
 * repository reporting drift on the day it was set up.
 */

import { existsSync, readdirSync, readFileSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';

import {
  applyPlan,
  buildPlan,
  countsFor,
  renderPlan,
} from './command-materialise.mjs';
import {
  CONFIG_FILE_NAME,
  DEFAULT_CONFIG,
  resolveConfig,
  withProfile,
} from './config.mjs';
import {
  declaredDependencies,
  initFailure,
  initRefusal,
  initSummary,
  inferRunner,
  initialConfig,
  placedHooksPath,
  scriptsAfter,
  tasksFor,
  unmetCommandKeys,
} from './init.mjs';
import { MANIFEST_FILE } from './manifest.mjs';
import { readProfileFlag } from './profile-flag.mjs';

const MANIFEST = 'package.json';

const readJsonIfPresent = (path) =>
  existsSync(path) ? JSON.parse(readFileSync(path, 'utf8')) : undefined;

const readTextIfPresent = (path) =>
  existsSync(path) ? readFileSync(path, 'utf8') : undefined;

/** Trailing newline included: every other file this kit writes has one. */
const writeJson = (path, value) =>
  writeFileSync(path, `${JSON.stringify(value, undefined, 2)}\n`);

/**
 * What the consumer can actually run, read from the link directory rather than
 * from any manifest's `bin` map. A declared bin that failed to link is exactly
 * the case a task must not be written for, and the two package managers link by
 * different mechanisms, so the directory is the only answer true under both.
 */
const installedBins = (root) => {
  const binDir = join(root, 'node_modules', '.bin');
  if (!existsSync(binDir)) return [];
  return readdirSync(binDir);
};

/**
 * The branch this repository is on, read from `.git/HEAD` rather than by
 * shelling out — no subprocess means no PATH to trust, the same reasoning
 * `verify-branch-name.mjs` records for the same read.
 *
 * At init time this is the trunk: init runs before any topic branch exists, and
 * a consumer adopting the kit from a feature branch is told which name was
 * recorded so they can correct it.
 */
const currentBranch = (root) => {
  try {
    const head = readFileSync(join(root, '.git', 'HEAD'), 'utf8').trim();
    return (
      /^ref:\s*refs\/heads\/(?<branch>.+)$/.exec(head)?.groups.branch ?? ''
    );
  } catch {
    return '';
  }
};

const writeConfig = ({ profile, root }) => {
  const manifest = readJsonIfPresent(join(root, MANIFEST));
  const runner = inferRunner({
    dependencies: declaredDependencies(manifest),
    files: readdirSync(root),
  });
  const defaultBranch = currentBranch(root);
  // Layered over what is already there, not written over it: this file is shared
  // with the gate runtime, so replacing it deletes that package's blocks. Read
  // RAW rather than through `resolveConfig`, which answers with devkit's keys
  // resolved and every other package's dropped.
  writeJson(
    join(root, CONFIG_FILE_NAME),
    initialConfig({
      commands: runner.commands,
      defaultBranch,
      existing: readJsonIfPresent(join(root, CONFIG_FILE_NAME)),
      profile,
    }),
  );
  return { ...runner, defaultBranch };
};

/**
 * Tasks are written into the consumer's manifest, and only into one that is
 * already there: creating a `package.json` would be this command guessing a
 * package name and a version for a repository whose author has not chosen them.
 */
const writeTasks = ({ profile, root }) => {
  const path = join(root, MANIFEST);
  const manifest = readJsonIfPresent(path);
  if (manifest === undefined) {
    return {
      added: [],
      skipped: [],
      warning: `init: no ${MANIFEST} here, so no gate tasks were written. Create one and re-run with --force to wire them up.`,
    };
  }

  const { added, scripts, skipped } = scriptsAfter({
    existing: manifest.scripts,
    tasks: tasksFor({ availableBins: installedBins(root), profile }),
  });
  if (added.length > 0) writeJson(path, { ...manifest, scripts });
  return { added, skipped, warning: undefined };
};

/**
 * The same steps `sync` takes, through the same plan and the same writer — see
 * `applyPlan`. The plan is returned rather than only applied, because `init`
 * decides whether the run succeeded from the plan itself; a command re-deriving
 * that from its own printed output would be reading its own guess.
 */
const materialise = ({ profile, root }) => {
  const { entries, manifest } = buildPlan({ profile, root });
  applyPlan({ entries, manifest, root });
  return entries;
};

/**
 * Everything past the refusals: write the config and the tasks, materialise,
 * then decide whether that amounted to setting the repository up.
 *
 * Separate from `runInit` so neither half carries both the argument handling
 * and the outcome handling. The refusals come first and independently, because
 * a refusal must leave the tree exactly as it found it.
 */
const applyInit = ({ profile, root }) => {
  const runner = writeConfig({ profile, root });
  const { added, skipped, warning } = writeTasks({ profile, root });
  const entries = materialise({ profile, root });
  const { written } = countsFor(entries);

  // Read AFTER the write, so it is the same layout `materialise` just used.
  // Taken from the pre-write config, a custom `paths.hooks` made this compare
  // the entries against the old directory, match nothing, and drop the one
  // instruction without which the hooks never run.
  const hooksPath = resolveConfig(
    readTextIfPresent(join(root, CONFIG_FILE_NAME)),
  ).paths.hooks;

  console.log(renderPlan(entries));
  if (warning !== undefined) console.error(warning);

  const failure = initFailure({
    planned: entries.length,
    unmet: unmetCommandKeys(entries),
  });
  if (failure !== undefined) {
    console.error(`\n${failure}`);
    return 1;
  }

  console.log(
    `\n${initSummary({
      added,
      defaultBranch: runner.defaultBranch,
      hooksPath: placedHooksPath({ entries, hooksPath }),
      profile,
      runner: runner.name,
      skipped,
      written,
    })}`,
  );
  return 0;
};

export const runInit = (argv, root) => {
  const { error, profile: flagged } = readProfileFlag(argv);
  if (error !== undefined) {
    console.error(error);
    return 1;
  }

  // The default is the profile ALREADY configured, not this package's. `--force`
  // rewrites the config; it does not re-choose the profile. Reading the built-in
  // default instead silently downgraded a `full` repository to `agent` — again
  // reachable from this command's own advice to create a `package.json` and
  // "re-run with --force" — and the workflows and hooks then stayed on disk
  // while dropping out of every later plan, so `doctor --check` reported clean
  // over a repository whose hooks could be deleted without a word.
  //
  // Validated BEFORE anything is written. `readProfileFlag` only checks that a
  // value follows the flag, so `--profile fulll` used to reach `writeConfig`,
  // land in `devkit.config.json`, and only then throw from `buildPlan` — leaving
  // a repository where `sync` and `doctor` throw the same error and `init`
  // refuses because a config it never chose to create is already there.
  const configured = resolveConfig(
    readTextIfPresent(join(root, CONFIG_FILE_NAME)),
  );
  const profile = withProfile({
    config: DEFAULT_CONFIG,
    profile: flagged ?? configured.profile,
  }).profile;

  const refusal = initRefusal({
    configExists: existsSync(join(root, CONFIG_FILE_NAME)),
    force: argv.includes('--force'),
    isGitRepository: existsSync(join(root, '.git')),
    manifestExists: existsSync(join(root, MANIFEST_FILE)),
  });
  if (refusal !== undefined) {
    console.error(refusal);
    return 1;
  }

  return applyInit({ profile, root });
};
