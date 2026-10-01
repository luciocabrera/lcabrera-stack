/**
 * Creates a `monorepo`-rung tree from the packed `@lcabrera/devkit` tarball,
 * installs every `@lcabrera/*` package it resolves from a tarball packed from
 * this checkout and served by a scratch registry, runs the tasks that tree
 * wires for itself, fetches `/` from the app its root `start` task serves, runs
 * every command its `devkit.config.json` hands its workflows and hooks, then
 * runs the upgrade that should find nothing left to add, and its commit-msg
 * hook, which create and the install must have turned on without being asked.
 * So the gate tests what the next release ships, together;
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
import { createServer } from 'node:net';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import process from 'node:process';
import { fileURLToPath } from 'node:url';

import {
  DEFAULT_CONFIG,
  targetPathFor,
} from '../packages/devkit/scripts/config.mjs';
import { configuredCommandRuns } from './lib/devkit-config-commands.mjs';
import { packOne, run } from './lib/devkit-pack.mjs';
import {
  serveRegistry,
  startedRegistry,
} from './lib/devkit-registry-server.mjs';
import { collectedTail, firstAnswer, stopGroup } from './lib/devkit-serve.mjs';
import {
  createFindings,
  execute,
  installedBin,
  installFindings,
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

const BLUEPRINT = 'packages/devkit/assets/workspace';

const CREATE_ARGS = ['create', TREE_NAME, '--profile', 'monorepo'];

const LOCKFILE = 'pnpm-lock.yaml';

const SERVE_FLAG = '--serve-registry';

const blueprintFindings = ({ tree }) =>
  missingBlueprintFiles({
    blueprint: run('git', ['ls-files', '--', '.'], join(REPO_ROOT, BLUEPRINT))
      .split('\n')
      .filter((line) => line !== ''),
    placed: Object.keys(readJson(join(tree, '.devkit-manifest.json')).files),
    targetOf: (path) =>
      targetPathFor({ assetPath: `workspace/${path}`, config: DEFAULT_CONFIG }),
  });

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

const DEVELOPER_ENV = Object.fromEntries(
  Object.entries(process.env).filter(([name]) => name !== 'CI'),
);

const developerInstallFindings = (tree) => installFindings(tree, DEVELOPER_ENV);

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

const freePort = () =>
  new Promise((resolve, reject) => {
    const server = createServer();
    server.once('error', reject);
    server.listen(0, '127.0.0.1', () => {
      const { port } = server.address();
      server.close(() => resolve(port));
    });
  });

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
    return serveFindings({ ...answer, output: output(), url });
  } finally {
    await stopGroup({ child, graceMs: STOP_GRACE_MS });
  }
};

const TREE_CHECKS = [
  blueprintFindings,
  toolchainBinFindings,
  installedHooksFindings,
  taskRunFindings,
  builtFindings,
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
  const { server, url } = startedRegistry({
    launch: [fileURLToPath(import.meta.url), SERVE_FLAG],
    packed,
    staging,
  });
  try {
    writeFileSync(join(tree, '.npmrc'), scopedRegistryConfig(url));
    return [
      ...created,
      ...(await treeFindings({
        checks: TREE_CHECKS,
        context: { devkit },
        prerequisites: [
          runtimeFindings,
          developerInstallFindings,
          sourceFindingsFor({ packed, registry: url }),
        ],
        tree,
      })),
    ];
  } finally {
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
      passed: `Created-workspace gate passed: \`devkit create --profile monorepo\` from the packed tarball placed every blueprint file, \`core.hooksPath\` was \`${HOOKS_PATH}\` after create and again after an install that found it unset, the tree installed every \`@lcabrera/*\` package it resolves from a tarball packed from this checkout through a scratch registry, with ${TOOLCHAIN_BINS.join(', ')} in its \`node_modules/.bin\`, ${tasksLabel()} and every command in its \`devkit.config.json\` all exited zero, the build wrote \`${BUILT_SERVER_ENTRY}\`, \`${commandLabel(START_ARGS)}\` served \`/\` with HTTP 200, none of them changed a committed file, \`devkit init --upgrade\` added no task and changed no committed file, and the commit-msg hook took a Conventional Commit and refused a malformed one.`,
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
