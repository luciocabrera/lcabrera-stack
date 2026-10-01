/**
 * Creates a `full`-rung tree from the packed `@lcabrera/devkit` tarball,
 * installs every `@lcabrera/*` package it resolves from a tarball packed from
 * this checkout and served by a scratch registry, checks its peers, runs the
 * tasks that tree wires for itself, seeds its database and runs its smoke
 * tests, fetches `/` from the app its root `start` task serves along with a
 * sorted and a filtered page held to SQL, runs every command its
 * `devkit.config.json` hands its workflows and hooks, then runs the upgrade
 * that should find nothing left to add, and its commit-msg hook, which create
 * and the install must have turned on without being asked. The database is the
 * one `DEVKIT_TREE_DB_HOST` names, else the tree's own `db:up` (Docker). So the gate tests what the next release ships, together;
 * `registry-tree:verify` is the check of what npm serves today. Every scratch
 * directory sits under the OS temp root so the tree inherits nothing from this
 * checkout (ADR-073).
 *
 * Usage: node scripts/verify-devkit-workspace.mjs
 *        (it re-runs itself with --serve-registry to host the scratch registry)
 * Exit codes: 0 = the created tree installs and its tasks pass, 1 = it does not.
 */

import { spawn } from 'node:child_process';
import {
  existsSync,
  mkdtempSync,
  readdirSync,
  rmSync,
  writeFileSync,
} from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import process from 'node:process';
import { fileURLToPath } from 'node:url';

import {
  DEFAULT_CONFIG,
  retiredAssetsFor,
  targetPathFor,
} from '../packages/devkit/scripts/config.mjs';
import { configuredCommandRuns } from './lib/devkit-config-commands.mjs';
import { packOne, run } from './lib/devkit-pack.mjs';
import {
  registryState,
  serveRegistry,
  startedRegistry,
  withRegistryFindings,
} from './lib/devkit-registry-server.mjs';
import { collectedTail, firstAnswer, stopGroup } from './lib/devkit-serve.mjs';
import {
  databaseLane,
  freePort,
  orderedRowFindings,
  queriedOrders,
} from './lib/devkit-tree-run-database.mjs';
import {
  createFindings,
  developerEnv,
  execute,
  installedBin,
  installFindings,
  peerFindings,
  readIfPresent,
  readJson,
  report,
  reportCrash,
  runtimeFindings,
  taskRunFindings,
  tasksLabel,
  trackedChangeFindings,
  TREE_NAME,
  treeFindings,
} from './lib/devkit-tree-run.mjs';
import { packedPackages } from './lib/devkit-workspace-closure.mjs';
import {
  scopedRegistryConfig,
  unpackedSourceFindings,
} from './lib/devkit-workspace-packages.mjs';
import {
  BUILT_SERVER_ENTRY,
  buildOutputFindings,
  commandLabel,
  commitHookFindings,
  hooksPathFindings,
  missingBlueprintFiles,
  missingToolchainBins,
  serveFindings,
  START_ARGS,
  taskFindings,
  tasksAddedByUpgrade,
  TOOLCHAIN_BINS,
  trackedPathsIn,
  trackedWritesByUpgrade,
} from './lib/devkit-workspace.mjs';

const REPO_ROOT = process.cwd();

const BLUEPRINT_GROUPS = ['workspace', 'full'];

const RETIRED_AT_FULL = new Set(retiredAssetsFor({ profile: 'full' }));

const CREATE_ARGS = ['create', TREE_NAME, '--profile', 'full', '--no-install'];

const LOCKFILE = 'pnpm-lock.yaml';

const SERVE_FLAG = '--serve-registry';

const blueprintFindings = ({ tree }) =>
  BLUEPRINT_GROUPS.flatMap((group) =>
    missingBlueprintFiles({
      blueprint: run(
        'git',
        ['ls-files', '--', '.'],
        join(REPO_ROOT, 'packages/devkit/assets', group),
      )
        .split('\n')
        .filter(
          (line) => line !== '' && !RETIRED_AT_FULL.has(`${group}/${line}`),
        ),
      placed: Object.keys(readJson(join(tree, '.devkit-manifest.json')).files),
      targetOf: (path) =>
        targetPathFor({
          assetPath: `${group}/${path}`,
          config: DEFAULT_CONFIG,
        }),
    }),
  );

const sourceFindingsFor =
  ({ packed, registry }) =>
  (tree) => {
    const lockfile = readIfPresent(join(tree, LOCKFILE));
    return lockfile === undefined
      ? [
          `the install wrote no \`${LOCKFILE}\`, so nothing shows where each \`@lcabrera/*\` package came from`,
        ]
      : unpackedSourceFindings({
          lockfile,
          packed: new Map(
            packed.map(({ integrity, manifest }) => [
              manifest.name,
              { integrity, version: manifest.version },
            ]),
          ),
          registry,
        });
  };

const toolchainBinFindings = ({ tree }) => {
  const binDirectory = join(tree, 'node_modules', '.bin');
  return missingToolchainBins({
    expected: TOOLCHAIN_BINS,
    present: existsSync(binDirectory) ? readdirSync(binDirectory) : [],
  });
};

const treeScripts = (tree) =>
  readJson(join(tree, 'package.json')).scripts ?? {};

const trackedPorcelain = (tree) =>
  run('git', ['status', '--porcelain', '--untracked-files=no'], tree);

const workingContentOf = ({ path, tree }) =>
  existsSync(join(tree, path))
    ? run('git', ['hash-object', '--', path], tree).trim()
    : 'deleted';

const trackedSnapshot = (tree) =>
  Object.fromEntries(
    trackedPathsIn(trackedPorcelain(tree)).map((path) => [
      path,
      workingContentOf({ path, tree }),
    ]),
  );

const upgradeFindings = ({ devkit, tree }) => {
  const scriptsBefore = treeScripts(tree);
  const trackedBefore = trackedSnapshot(tree);
  const upgraded = taskFindings({
    label: 'devkit init --upgrade',
    ...execute({ args: ['init', '--upgrade'], command: devkit, cwd: tree }),
  });
  return upgraded.length > 0
    ? upgraded
    : [
        ...tasksAddedByUpgrade({
          after: treeScripts(tree),
          before: scriptsBefore,
        }),
        ...trackedWritesByUpgrade({
          after: trackedSnapshot(tree),
          before: trackedBefore,
        }),
      ];
};

const HOOK_IDENTITY = [
  '-c',
  'user.name=gate',
  '-c',
  'user.email=gate@localhost',
];

const commitWith = ({ message, tree }) =>
  execute({
    args: [
      ...HOOK_IDENTITY,
      'commit',
      '--allow-empty',
      '--quiet',
      '-m',
      message,
    ],
    command: 'git',
    cwd: tree,
  });

const HOOKS_PATH = DEFAULT_CONFIG.paths.hooks;

const INSTALL_STEP = commandLabel(['install', '--no-frozen-lockfile']);

const developerInstallFindings = (tree) =>
  installFindings(tree, developerEnv());

const hooksPathIn = (tree) =>
  execute({
    args: ['config', '--local', '--get', 'core.hooksPath'],
    command: 'git',
    cwd: tree,
  }).output.trim();

const createdHooksFindings = (tree) => {
  const actual = hooksPathIn(tree);
  if (actual !== '') {
    run('git', ['config', '--local', '--unset', 'core.hooksPath'], tree);
  }
  return hooksPathFindings({
    actual,
    expected: HOOKS_PATH,
    step: CREATE_ARGS.join(' '),
  });
};

const installedHooksFindings = ({ tree }) =>
  hooksPathFindings({
    actual: hooksPathIn(tree),
    expected: HOOKS_PATH,
    step: INSTALL_STEP,
  });

const commitHookRunFindings = ({ tree }) =>
  commitHookFindings({
    accepted: commitWith({ message: 'chore: probe the commit hook', tree }),
    refused: commitWith({ message: 'probe the commit hook', tree }),
  });

const configuredCommandFindings = ({ tree }) => {
  const { findings, runs } = configuredCommandRuns(
    readJson(join(tree, 'devkit.config.json')).commands,
  );
  return [
    ...findings,
    ...runs.flatMap(({ command, label }) =>
      taskFindings({
        label,
        ...execute({ args: ['-c', command], command: 'sh', cwd: tree }),
      }),
    ),
  ];
};

const builtFindings = ({ tree }) =>
  buildOutputFindings({ exists: existsSync(join(tree, BUILT_SERVER_ENTRY)) });

const SERVE_DEADLINE_MS = 60_000;

const SERVE_POLL_MS = 500;

const SERVE_REQUEST_TIMEOUT_MS = 5000;

const STOP_GRACE_MS = 5000;

const SERVE_OUTPUT_LIMIT_CHARS = 64 * 1024;

const servedFindings = async ({ tree }) => {
  const port = await freePort();
  writeFileSync(join(tree, 'apps', 'web', '.env'), `PORT=${port}\n`);
  const url = `http://127.0.0.1:${port}/`;
  const child = spawn(join(tree, 'node_modules', '.bin', 'vp'), START_ARGS, {
    cwd: tree,
    detached: true,
  });
  const output = collectedTail({ child, limit: SERVE_OUTPUT_LIMIT_CHARS });
  try {
    const answer = await firstAnswer({
      child,
      deadline: Date.now() + SERVE_DEADLINE_MS,
      pollMs: SERVE_POLL_MS,
      requestTimeoutMs: SERVE_REQUEST_TIMEOUT_MS,
      url,
    });
    const served = serveFindings({ ...answer, output: output(), url });
    if (served.length > 0) return served;
    const { answers, findings } = queriedOrders({ tree });
    return answers === undefined
      ? findings
      : await orderedRowFindings({ answers, baseUrl: url });
  } finally {
    await stopGroup({ child, graceMs: STOP_GRACE_MS });
  }
};

const treeChecks = (database) => [
  blueprintFindings,
  peerFindings,
  toolchainBinFindings,
  installedHooksFindings,
  taskRunFindings,
  builtFindings,
  database.prepared,
  servedFindings,
  configuredCommandFindings,
  trackedChangeFindings,
  upgradeFindings,
  commitHookRunFindings,
];

const checkedTree = async ({ devkit, staging, tree }) => {
  const created = createdHooksFindings(tree);
  const { findings, packed } = packedPackages({
    repoRoot: REPO_ROOT,
    staging,
    tree,
  });
  if (findings.length > 0) return [...created, ...findings];
  const database = databaseLane();
  const { log, server, url } = startedRegistry({
    launch: [fileURLToPath(import.meta.url), SERVE_FLAG],
    packed,
    staging,
  });
  try {
    writeFileSync(join(tree, '.npmrc'), scopedRegistryConfig(url));
    const found = await treeFindings({
      checks: treeChecks(database),
      context: { devkit },
      prerequisites: [
        runtimeFindings,
        developerInstallFindings,
        sourceFindingsFor({ packed, registry: url }),
      ],
      tree,
    });
    return withRegistryFindings({
      ...(await registryState({ server, url })),
      findings: [...created, ...found],
      log: readIfPresent(log),
      url,
    });
  } finally {
    database.teardown();
    server.kill();
  }
};

const main = async () => {
  const staging = mkdtempSync(join(tmpdir(), 'devkit-workspace-pack-'));
  const holder = mkdtempSync(join(tmpdir(), 'devkit-workspace-holder-'));
  const parent = mkdtempSync(join(tmpdir(), 'devkit-workspace-tree-'));

  try {
    const { tarball } = packOne({
      directory: 'devkit',
      into: staging,
      repoRoot: REPO_ROOT,
    });
    const devkit = installedBin({ bin: 'devkit', holder, spec: tarball });
    const created = createFindings({ args: CREATE_ARGS, bin: devkit, parent });
    report({
      findings:
        created.length > 0
          ? created
          : await checkedTree({
              devkit,
              staging,
              tree: join(parent, TREE_NAME),
            }),
      passed: `Created-workspace gate passed: \`devkit create --profile full\` from the packed tarball placed every blueprint file, \`core.hooksPath\` was \`${HOOKS_PATH}\` after create and again after an install that found it unset, the tree installed every \`@lcabrera/*\` package it resolves from a tarball packed from this checkout through a scratch registry with no unmet peer, with ${TOOLCHAIN_BINS.join(', ')} in its \`node_modules/.bin\`, ${tasksLabel()} and every command in its \`devkit.config.json\` all exited zero, the build wrote \`${BUILT_SERVER_ENTRY}\`, the tree's seed and smoke tests passed against its database, \`${commandLabel(START_ARGS)}\` served \`/\` with HTTP 200 and a sorted and a filtered page whose rows match SQL, none of them changed a committed file, \`devkit init --upgrade\` added no task and changed no committed file, and the commit-msg hook took a Conventional Commit and refused a malformed one.`,
      title: 'Created-workspace gate',
    });
  } finally {
    for (const directory of [staging, holder, parent]) {
      rmSync(directory, { force: true, recursive: true });
    }
  }
};

const [mode, servedIndex, servedPortFile] = process.argv.slice(2);

try {
  if (mode === SERVE_FLAG) {
    serveRegistry({ indexPath: servedIndex, portFile: servedPortFile });
  } else {
    await main();
  }
} catch (error) {
  reportCrash(error);
}
