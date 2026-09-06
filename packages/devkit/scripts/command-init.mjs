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
  printPlacementNotice,
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
  recordsDefaultBranch,
  upgradeKeptCiSetup,
  upgradeKeptCommands,
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

const writeJson = (path, value) =>
  writeFileSync(path, `${JSON.stringify(value, undefined, 2)}\n`);

const installedBins = (root) => {
  const binDir = join(root, 'node_modules', '.bin');
  if (!existsSync(binDir)) return [];
  return readdirSync(binDir);
};

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

const writeConfig = ({ profile, root, upgrade }) => {
  const manifest = readJsonIfPresent(join(root, MANIFEST));
  const runner = inferRunner({
    dependencies: declaredDependencies(manifest),
    files: readdirSync(root),
  });
  const defaultBranch = currentBranch(root);
  const existing = readJsonIfPresent(join(root, CONFIG_FILE_NAME));
  writeJson(
    join(root, CONFIG_FILE_NAME),
    initialConfig({
      ciSetup: runner.ciSetup,
      commands: runner.commands,
      defaultBranch,
      existing,
      profile,
      upgrade,
    }),
  );
  return {
    ...runner,
    defaultBranch,
    kept: upgrade
      ? [
          ...upgradeKeptCommands({ commands: runner.commands, existing }),
          ...upgradeKeptCiSetup({ ciSetup: runner.ciSetup, existing }),
        ]
      : [],
    recordedTrunk: recordsDefaultBranch({ defaultBranch, existing, upgrade }),
  };
};

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

const materialise = ({ profile, root }) => {
  const { entries, manifest } = buildPlan({ profile, root });
  applyPlan({ entries, manifest, root });
  return entries;
};

export const applyInit = ({ profile, root, upgrade }) => {
  const runner = writeConfig({ profile, root, upgrade });
  const { added, skipped, warning } = writeTasks({ profile, root });
  const entries = materialise({ profile, root });
  const { written } = countsFor(entries);

  const hooksPath = resolveConfig(
    readTextIfPresent(join(root, CONFIG_FILE_NAME)),
  ).paths.hooks;

  printPlacementNotice(profile);
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

  if (runner.kept.length > 0) {
    const kept = runner.kept.map((line) => `  ${line}`).join('\n');
    console.log(`\nLeft alone, because you set them:\n${kept}`);
  }

  console.log(
    `\n${initSummary({
      added,
      defaultBranch: runner.defaultBranch,
      hooksPath: placedHooksPath({ entries, hooksPath }),
      profile,
      recordedTrunk: runner.recordedTrunk,
      runner: runner.name,
      skipped,
      upgrade,
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

  const configured = resolveConfig(
    readTextIfPresent(join(root, CONFIG_FILE_NAME)),
  );
  const profile = withProfile({
    config: DEFAULT_CONFIG,
    profile: flagged ?? configured.profile,
  }).profile;

  const upgrade = argv.includes('--upgrade');
  const refusal = initRefusal({
    configExists: existsSync(join(root, CONFIG_FILE_NAME)),
    force: argv.includes('--force'),
    isGitRepository: existsSync(join(root, '.git')),
    manifestExists: existsSync(join(root, MANIFEST_FILE)),
    upgrade,
  });
  if (refusal !== undefined) {
    console.error(refusal);
    return 1;
  }

  return applyInit({ profile, root, upgrade });
};
