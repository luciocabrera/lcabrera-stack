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
  buildPlan,
  countsFor,
  nextManifestFor,
  renderPlan,
} from './command-materialise.mjs';
import { CONFIG_FILE_NAME, DEFAULT_CONFIG } from './config.mjs';
import {
  initFailure,
  initRefusal,
  initSummary,
  inferRunner,
  initialConfig,
  scriptsAfter,
  tasksFor,
  unmetCommandKeys,
} from './init.mjs';
import { MANIFEST_FILE, serialiseManifest } from './manifest.mjs';
import { readProfileFlag } from './profile-flag.mjs';
import { applySync } from './sync.mjs';

const MANIFEST = 'package.json';

const readJsonIfPresent = (path) =>
  existsSync(path) ? JSON.parse(readFileSync(path, 'utf8')) : undefined;

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

/** Both spellings of a dependency, since either one puts a bin on the path. */
const declaredDependencies = (manifest) => [
  ...Object.keys(manifest?.dependencies ?? {}),
  ...Object.keys(manifest?.devDependencies ?? {}),
];

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
  writeJson(
    join(root, CONFIG_FILE_NAME),
    initialConfig({ commands: runner.commands, defaultBranch, profile }),
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
 * The same three steps `sync` takes, in the same order and through the same
 * plan. Kept here rather than delegating to `runSync` because `init` needs the
 * plan itself to decide whether the run succeeded, and a command that re-derived
 * that from its own printed output would be reading its own guess.
 */
const materialise = ({ profile, root }) => {
  const { entries, manifest } = buildPlan({ profile, root });
  applySync({ entries, root });

  const updated = serialiseManifest(nextManifestFor({ entries, manifest }));
  if (updated !== serialiseManifest(manifest)) {
    writeFileSync(join(root, MANIFEST_FILE), updated);
  }
  return entries;
};

export const runInit = (argv, root) => {
  const { error, profile: flagged } = readProfileFlag(argv);
  if (error !== undefined) {
    console.error(error);
    return 1;
  }
  const profile = flagged ?? DEFAULT_CONFIG.profile;

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

  const runner = writeConfig({ profile, root });
  const { added, skipped, warning } = writeTasks({ profile, root });

  const entries = materialise({ profile, root });
  const { written } = countsFor(entries);

  console.log(renderPlan(entries));
  if (warning !== undefined) console.error(warning);

  const failure = initFailure({ unmet: unmetCommandKeys(entries), written });
  if (failure !== undefined) {
    console.error(`\n${failure}`);
    return 1;
  }

  console.log(
    `\n${initSummary({
      added,
      defaultBranch: runner.defaultBranch,
      profile,
      runner: runner.name,
      skipped,
      written,
    })}`,
  );
  return 0;
};
