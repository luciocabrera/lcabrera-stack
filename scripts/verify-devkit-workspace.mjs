/**
 * Creates a `monorepo`-rung tree from the packed `@lcabrera/devkit` tarball,
 * installs every `@lcabrera/*` package it resolves from a tarball packed from
 * this checkout and served by a scratch registry, runs the tasks that tree
 * wires for itself, fetches `/` from the app its root `start` task serves, then
 * runs the upgrade that should find nothing left to add, and its commit-msg
 * hook. So the gate tests what the next release ships, together;
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
  readFileSync,
  rmSync,
  writeFileSync,
} from 'node:fs';
import { createServer } from 'node:net';
import { tmpdir } from 'node:os';
import { basename, join } from 'node:path';
import process from 'node:process';
import { fileURLToPath } from 'node:url';

import {
  DEFAULT_CONFIG,
  targetPathFor,
} from '../packages/devkit/scripts/config.mjs';
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
import {
  catalogsOf,
  missingPackageFindings,
  packageClosure,
  digestsOf,
  installedManifest,
  rangeFindings,
  scopedDeclarations,
  scopedNames,
  scopedRegistryConfig,
  unpackedSourceFindings,
} from './lib/devkit-workspace-packages.mjs';
import {
  BUILT_SERVER_ENTRY,
  buildOutputFindings,
  commandLabel,
  commitHookFindings,
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

const WORKSPACE_FILE = 'pnpm-workspace.yaml';

const LOCKFILE = 'pnpm-lock.yaml';

const SERVE_FLAG = '--serve-registry';

const checkoutPackages = () =>
  new Map(
    readdirSync(join(REPO_ROOT, 'packages'), { withFileTypes: true })
      .filter((entry) => entry.isDirectory())
      .map((entry) => ({
        directory: entry.name,
        manifest: readJson(
          join(REPO_ROOT, 'packages', entry.name, 'package.json'),
        ),
      }))
      .filter(({ manifest }) => typeof manifest.name === 'string')
      .map((found) => [found.manifest.name, found]),
  );

const treeManifests = (tree) =>
  run('git', ['ls-files', '--', '*package.json'], tree)
    .split('\n')
    .filter((path) => path === 'package.json' || path.endsWith('/package.json'))
    .map((path) => ({
      manifest: readJson(join(tree, path)),
      where: `\`${path}\``,
    }));

const packAll = ({ directories, staging }) =>
  directories.map((directory) =>
    packOne({ directory, into: staging, repoRoot: REPO_ROOT }),
  );

const packedPackages = ({ staging, tree }) => {
  const checkout = checkoutPackages();
  const manifests = treeManifests(tree);
  const { missing, names } = packageClosure({
    manifestOf: (name) => checkout.get(name)?.manifest,
    roots: manifests.flatMap(({ manifest }) => scopedNames(manifest)),
  });
  if (missing.length > 0) {
    return { findings: missingPackageFindings(missing), packed: [] };
  }
  run('vp', ['run', 'packages:build'], REPO_ROOT);
  const packed = packAll({
    directories: names.map((name) => checkout.get(name).directory),
    staging,
  });
  const declarations = scopedDeclarations({
    catalogs: catalogsOf(readIfPresent(join(tree, WORKSPACE_FILE)) ?? ''),
    manifests: [
      ...manifests,
      ...packed.map(({ manifest }) => ({
        manifest: installedManifest(manifest),
        where: `the packed \`${manifest.name}\``,
      })),
    ],
  });
  return {
    findings: rangeFindings({
      declarations,
      versions: new Map(
        packed.map(({ manifest }) => [manifest.name, manifest.version]),
      ),
    }),
    packed: packed.map(({ manifest, tarball }) => ({
      file: basename(tarball),
      manifest,
      ...digestsOf(readFileSync(tarball)),
    })),
  };
};

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

const commitHookRunFindings = ({ tree }) => {
  run('git', ['config', 'core.hooksPath', '.githooks'], tree);
  return commitHookFindings({
    accepted: commitWith({ message: 'chore: probe the commit hook', tree }),
    refused: commitWith({ message: 'probe the commit hook', tree }),
  });
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
  taskRunFindings,
  builtFindings,
  servedFindings,
  trackedChangeFindings,
  upgradeFindings,
  commitHookRunFindings,
];

const checkedTree = async ({ devkit, staging, tree }) => {
  const { findings, packed } = packedPackages({ staging, tree });
  if (findings.length > 0) return findings;
  const { server, url } = startedRegistry({
    launch: [fileURLToPath(import.meta.url), SERVE_FLAG],
    packed,
    staging,
  });
  try {
    writeFileSync(join(tree, '.npmrc'), scopedRegistryConfig(url));
    return await treeFindings({
      checks: TREE_CHECKS,
      context: { devkit },
      prerequisites: [
        runtimeFindings,
        installFindings,
        sourceFindingsFor({ packed, registry: url }),
      ],
      tree,
    });
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
      passed: `Created-workspace gate passed: \`devkit create --profile monorepo\` from the packed tarball placed every blueprint file, the tree installed every \`@lcabrera/*\` package it resolves from a tarball packed from this checkout through a scratch registry, with ${TOOLCHAIN_BINS.join(', ')} in its \`node_modules/.bin\`, ${tasksLabel()} all exited zero, the build wrote \`${BUILT_SERVER_ENTRY}\`, \`${commandLabel(START_ARGS)}\` served \`/\` with HTTP 200, none of them changed a committed file, \`devkit init --upgrade\` added no task and changed no committed file, and the commit-msg hook took a Conventional Commit and refused a malformed one.`,
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
