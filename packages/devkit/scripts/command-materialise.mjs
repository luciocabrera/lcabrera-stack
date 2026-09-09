/*
 * The one place sync, doctor and init agree on: read the package's assets and
 * the consumer's state, produce the plan, and — for the two commands that
 * write — apply it and record what was written. All three render the same plan.
 *
 * The plan covers the task block as well as the files. It is the same tree
 * being materialised, so a command that reconciled the tasks by its own route
 * would be a second answer to the question this module exists to have one
 * answer to.
 *
 * Applying lives here rather than in each command because `init` is `sync` plus
 * wiring. Written twice, the two drift, and the way that shows up is an `init`
 * whose files a later `doctor` does not recognise: a repository reporting drift
 * on the day it was set up.
 */

import { existsSync, readdirSync, readFileSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

import { ACCEPTED_FILE, parseAccepted } from './accepted.mjs';
import {
  CONFIG_FILE_NAME,
  includesRung,
  isExecutableAsset,
  placementNotice,
  resolveConfig,
  withProfile,
} from './config.mjs';
import { readFilesUnder } from './files.mjs';
import {
  GATE_TASKS,
  tasksFor,
  unmetCommandKeys,
  withheldTasks,
} from './init.mjs';
import {
  isAcknowledged,
  isReported,
  isWritten,
  MANIFEST_FILE,
  parseManifest,
  serialiseManifest,
} from './manifest.mjs';
import { declaredPeerNames, installedPeerVersion } from './peer.mjs';
import {
  applySync,
  manifestAfter,
  onDiskHasher,
  planSync,
  withAcceptance,
} from './sync.mjs';
import {
  isTaskWritten,
  planTasks,
  recordedTasks,
  renderTasks,
  scriptsAfterTasks,
} from './tasks.mjs';
import { WORKSPACE_SCRIPTS } from './workspace.mjs';

const packageRoot = dirname(dirname(fileURLToPath(import.meta.url)));

const PACKAGE_MANIFEST = 'package.json';

const readIfPresent = (path) =>
  existsSync(path) ? readFileSync(path, 'utf8') : undefined;

const readJsonIfPresent = (path) => {
  const raw = readIfPresent(path);
  return raw === undefined ? undefined : JSON.parse(raw);
};

const installedBins = (root) => {
  const binDir = join(root, 'node_modules', '.bin');
  return existsSync(binDir) ? readdirSync(binDir) : [];
};

/**
 * The two sets of tasks a run reconciles, and which of them it may establish.
 *
 * `init` is the command that wires the gate tasks into a repository, so it is
 * the one that may write them where the manifest holds none. The blueprint's
 * block is never established here: it names binaries only the manifest `create`
 * writes declares, so a repository that took the rung without them would be
 * handed tasks that cannot run.
 *
 * @param {{ config: object, establish: boolean, root: string }} args
 */
const taskGroups = ({ config, establish, root }) => {
  const { profile } = config;
  const gate = {
    establish,
    tasks: tasksFor({ profile }),
    withheld: new Set(
      withheldTasks({ availableBins: installedBins(root), profile }),
    ),
  };
  return includesRung({ profile, rung: 'monorepo' })
    ? [gate, { tasks: WORKSPACE_SCRIPTS }]
    : [gate];
};

const EVERY_TASK_NAME = [
  ...Object.keys(GATE_TASKS),
  ...Object.keys(WORKSPACE_SCRIPTS),
];

/**
 * A repository with no manifest gets no task plan at all, rather than a plan
 * nothing can apply: recording tasks as written into a file that does not exist
 * would leave the record claiming what the tree does not have.
 */
const plannedTasks = ({ config, establish, manifest, root }) => {
  const packageManifest = readJsonIfPresent(join(root, PACKAGE_MANIFEST));
  if (packageManifest === undefined) return [];
  return planTasks({
    groups: taskGroups({ config, establish, root }),
    recorded: manifest.tasks,
    scripts: packageManifest.scripts,
    shipped: EVERY_TASK_NAME,
  });
};

const packageVersion = () =>
  JSON.parse(readFileSync(join(packageRoot, 'package.json'), 'utf8')).version;

const readAssets = () => {
  const assetsRoot = join(packageRoot, 'assets');
  if (!existsSync(assetsRoot)) return [];
  return readFilesUnder({ directory: assetsRoot, root: assetsRoot }).map(
    (asset) => ({ ...asset, executable: isExecutableAsset(asset.path) }),
  );
};

const peerResolutionBase = () => join(packageRoot, 'package.json');

const resolvePeerVersions = (assets) =>
  new Map(
    declaredPeerNames(assets).map((packageName) => [
      packageName,
      installedPeerVersion({ from: peerResolutionBase(), packageName }),
    ]),
  );

export const buildPlan = ({ establish = false, profile, root }) => {
  const configured = resolveConfig(readIfPresent(join(root, CONFIG_FILE_NAME)));
  const config =
    profile === undefined
      ? configured
      : withProfile({ config: configured, profile });
  const manifest = parseManifest(
    readIfPresent(join(root, MANIFEST_FILE)),
    packageVersion(),
  );
  const assets = readAssets();
  const accepted = parseAccepted(readIfPresent(join(root, ACCEPTED_FILE)));
  const entries = withAcceptance({
    accepted,
    entries: planSync({
      assets,
      config,
      manifest,
      onDiskHash: onDiskHasher(root),
      peerVersions: resolvePeerVersions(assets),
    }),
  });
  return {
    accepted,
    config,
    entries,
    manifest,
    tasks: plannedTasks({ config, establish, manifest, root }),
  };
};

const nextManifestFor = ({ entries, manifest, tasks = [] }) =>
  manifestAfter({
    entries,
    previous: manifest,
    tasks: recordedTasks({ entries: tasks, recorded: manifest.tasks }),
    version: packageVersion(),
  });

const applyTasks = ({ root, tasks }) => {
  if (tasks.every((entry) => !isTaskWritten(entry.state))) return;
  const path = join(root, PACKAGE_MANIFEST);
  const packageManifest = readJsonIfPresent(path);
  if (packageManifest === undefined) return;
  writeFileSync(
    path,
    `${JSON.stringify(
      {
        ...packageManifest,
        scripts: scriptsAfterTasks({
          entries: tasks,
          scripts: packageManifest.scripts,
        }),
      },
      undefined,
      2,
    )}\n`,
  );
};

export const applyPlan = ({ entries, manifest, root, tasks = [] }) => {
  applySync({ entries, root });
  applyTasks({ root, tasks });

  const updated = serialiseManifest(
    nextManifestFor({ entries, manifest, tasks }),
  );
  if (updated !== serialiseManifest(manifest)) {
    writeFileSync(join(root, MANIFEST_FILE), updated);
  }
};

const UNMET_LABELS = {
  config: 'not written — no config key set for',
  peer: 'not written — no compatible peer for',
};

const STATE_LABELS = {
  acknowledged: 'left alone — acknowledged',
  added: 'added',
  conflict: 'left alone — a file you wrote is already there',
  current: 'up to date',
  modified: 'left alone — locally modified',
  restored: 'restored',
  unmet: UNMET_LABELS.config,
  unresolved: 'not written — no command configured for',
  updated: 'updated',
};

const STATE_COLUMN_WIDTH = Math.max(
  ...Object.keys(STATE_LABELS).map((state) => state.length),
);

const STATES_NAMING_WHAT_IS_MISSING = new Set(['unmet', 'unresolved']);

const labelFor = (entry) =>
  entry.state === 'unmet' && entry.unmetKind === 'peer'
    ? UNMET_LABELS.peer
    : STATE_LABELS[entry.state];

const detailFor = (entry) => {
  if (STATES_NAMING_WHAT_IS_MISSING.has(entry.state)) {
    return `${labelFor(entry)} ${entry.missing.join(', ')}`;
  }
  if (isAcknowledged(entry.state)) {
    return `${labelFor(entry)}: ${entry.reason}`;
  }
  return labelFor(entry);
};

export const renderPlan = (entries, { verbose = false } = {}) => {
  const notable = entries.filter(
    (entry) =>
      isWritten(entry.state) ||
      isReported(entry.state) ||
      (verbose && isAcknowledged(entry.state)),
  );
  if (notable.length === 0) return 'Everything is up to date.';
  return notable
    .map(
      (entry) =>
        `  ${entry.state.padEnd(STATE_COLUMN_WIDTH)} ${entry.path}  (${detailFor(entry)})`,
    )
    .join('\n');
};

/**
 * What a run held back for want of a config key, and how to get it.
 *
 * Sync is the command every other report sends a reader to, and it is the one
 * command that cannot clear this: the keys are written by `init`, so a reader
 * told only to sync runs it, sees the same line, and has nowhere to go. It
 * names the keys rather than counting them, because the reader's next step is
 * to look for them.
 *
 * @param {{ missing?: string[], state: string }[]} entries
 * @returns {string | undefined}
 */
export const unresolvedNotice = (entries) => {
  const keys = unmetCommandKeys(entries);
  if (keys.length === 0) return;
  return `${keys.length} command key(s) your config does not set: ${keys.join(', ')}. The files that use them were not written, and \`devkit sync\` cannot supply them — run \`devkit init --upgrade\` to add the keys this version infers, keeping everything you have set, or write them into ${CONFIG_FILE_NAME} under "commands" yourself.`;
};

export const printTaskPlan = (tasks) => {
  const report = renderTasks(tasks);
  if (report !== undefined) {
    console.log(`\nTasks in ${PACKAGE_MANIFEST}:\n${report}`);
  }
};

export const printPlacementNotice = (profile) => {
  const notice = placementNotice(profile);
  if (notice !== undefined) console.log(notice);
};

export const countsFor = (entries) => ({
  reported: entries.filter((entry) => isReported(entry.state)).length,
  written: entries.filter((entry) => isWritten(entry.state)).length,
});
