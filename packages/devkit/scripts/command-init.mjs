/*
 * The `init` command: the filesystem half.
 *
 * Every judgement it makes comes from `init.mjs`, so this file is the reading,
 * the writing and the exit code. It ends by going through the same `buildPlan`
 * that `sync` and `doctor` use rather than materialising by its own route — an
 * init that placed files a later `doctor` would not recognise would leave a
 * repository reporting drift on the day it was set up.
 */

import {
  existsSync,
  readdirSync,
  readFileSync,
  realpathSync,
  writeFileSync,
} from 'node:fs';
import { join, resolve } from 'node:path';

import {
  applyPlan,
  buildPlan,
  countsFor,
  printPlacementNotice,
  printTaskPlan,
  renderPlan,
  taskNamesAfterInit,
} from './command-materialise.mjs';
import {
  CONFIG_FILE_NAME,
  DEFAULT_CONFIG,
  resolveConfig,
  withProfile,
} from './config.mjs';
import { readGit } from './git-exec.mjs';
import {
  declaredDependencies,
  inferRunner,
  initFailure,
  initialConfig,
  initRefusal,
  initSummary,
  isDefaultBranchRecorded,
  placedHooksPath,
  unmetCommandKeys,
  upgradeKeptCiSetup,
  upgradeKeptCommands,
} from './init.mjs';
import { MANIFEST_FILE } from './manifest.mjs';
import { readProfileFlag } from './profile-flag.mjs';
import { taskOutcomes } from './tasks.mjs';

const MANIFEST = 'package.json';

const canonicalPath = (path) => {
  try {
    return realpathSync(path);
  } catch {
    return path;
  }
};

const gitRunsHooksFrom = ({ hooksPath, root }) => {
  try {
    const pointed = readGit({
      args: ['config', '--get', 'core.hooksPath'],
      cwd: root,
    });
    return (
      pointed !== '' &&
      canonicalPath(resolve(root, pointed)) ===
        canonicalPath(resolve(root, hooksPath))
    );
  } catch {
    return false;
  }
};

const readJsonIfPresent = (path) =>
  existsSync(path) ? JSON.parse(readFileSync(path, 'utf8')) : undefined;

const readTextIfPresent = (path) =>
  existsSync(path) ? readFileSync(path, 'utf8') : undefined;

const writeJson = (path, value) =>
  writeFileSync(path, `${JSON.stringify(value, undefined, 2)}\n`);

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

const writeConfig = ({ declaredBins, profile, root, upgrade, userAgent }) => {
  const manifest = readJsonIfPresent(join(root, MANIFEST));
  const runner = inferRunner({
    dependencies: declaredDependencies(manifest),
    files: readdirSync(root),
    tasks: taskNamesAfterInit({ declaredBins, profile, root }),
    userAgent,
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
    recordedTrunk: isDefaultBranchRecorded({
      defaultBranch,
      existing,
      upgrade,
    }),
  };
};

/**
 * The tasks are wired by the plan, so the one thing left to say here is that
 * there was nothing to wire them into: a repository with no manifest gets the
 * files and none of the tasks, and the run would otherwise report only the
 * files.
 */
const missingManifestWarning = (root) =>
  existsSync(join(root, MANIFEST))
    ? undefined
    : `init: no ${MANIFEST} here, so no gate tasks were written. Create one and re-run with --force to wire them up.`;

/**
 * @param {{ declaredBins: readonly string[], profile: string, root: string }} args
 */
const materialise = ({ declaredBins, profile, root }) => {
  const { entries, manifest, refusal, tasks } = buildPlan({
    declaredBins,
    establish: true,
    profile,
    root,
  });
  applyPlan({ entries, manifest, root, tasks });
  return { entries, refusal, tasks };
};

/**
 * @param {{ activatesHooks?: boolean, declaredBins?: readonly string[],
 *           profile: string, root: string, upgrade: boolean,
 *           userAgent?: string }} args
 * @returns {{ code: number, hooksPath?: string }}
 */
export const applyInit = ({
  activatesHooks = false,
  declaredBins = [],
  profile,
  root,
  upgrade,
  userAgent,
}) => {
  const runner = writeConfig({
    declaredBins,
    profile,
    root,
    upgrade,
    userAgent,
  });
  const warning = missingManifestWarning(root);
  const { entries, refusal, tasks } = materialise({
    declaredBins,
    profile,
    root,
  });
  const { added, skipped } = taskOutcomes(tasks);
  const { written } = countsFor(entries);

  const hooksPath = resolveConfig(
    readTextIfPresent(join(root, CONFIG_FILE_NAME)),
  ).paths.hooks;

  printPlacementNotice(profile);
  console.log(renderPlan(entries));
  printTaskPlan(tasks);
  if (warning !== undefined) console.error(warning);
  if (refusal !== undefined) {
    console.error(`\n${refusal}`);
    return { code: 1 };
  }

  const failure = initFailure({
    planned: entries.length,
    unmet: unmetCommandKeys(entries),
  });
  if (failure !== undefined) {
    console.error(`\n${failure}`);
    return { code: 1 };
  }

  if (runner.kept.length > 0) {
    const kept = runner.kept.map((line) => `  ${line}`).join('\n');
    console.log(`\nLeft alone, because you set them:\n${kept}`);
  }

  const placed = placedHooksPath({ entries, hooksPath });
  console.log(
    `\n${initSummary({
      added,
      defaultBranch: runner.defaultBranch,
      hooksPath: activatesHooks ? undefined : placed,
      profile,
      recordedTrunk: runner.recordedTrunk,
      runner: runner.name,
      skipped,
      upgrade,
      written,
    })}`,
  );
  return { code: 0, hooksPath: placed };
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

  return applyInit({
    activatesHooks: gitRunsHooksFrom({
      hooksPath: configured.paths.hooks,
      root,
    }),
    profile,
    root,
    upgrade,
  }).code;
};
