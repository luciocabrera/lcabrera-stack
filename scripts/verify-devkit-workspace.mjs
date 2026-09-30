/**
 * Creates a `monorepo`-rung tree from the packed `@lcabrera/devkit` tarball,
 * installs every `@lcabrera/*` package it resolves from a tarball packed from
 * this checkout, and runs the tasks that tree wires for itself, the upgrade
 * that should find nothing left to add, and its commit-msg hook. So the gate
 * tests what the next release ships, together; `registry-tree:verify` is
 * the check of what npm serves today. Every scratch directory sits under the OS
 * temp root so the tree inherits nothing from this checkout (ADR-073).
 *
 * Usage: node scripts/verify-devkit-workspace.mjs
 * Exit codes: 0 = the created tree installs and its tasks pass, 1 = it does not.
 */

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

import {
  DEFAULT_CONFIG,
  targetPathFor,
} from '../packages/devkit/scripts/config.mjs';
import { packOne, run } from './lib/devkit-pack.mjs';
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
  rangeFindings,
  registryResolvedFindings,
  scopedDeclarations,
  scopedNames,
  withTarballOverrides,
} from './lib/devkit-workspace-packages.mjs';
import {
  commitHookFindings,
  missingBlueprintFiles,
  missingToolchainBins,
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

const SCRATCH_IDENTITY = [
  '-c',
  'user.name=workspace-gate',
  '-c',
  'user.email=workspace-gate@invalid',
  '-c',
  'commit.gpgsign=false',
];

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
    return { findings: missingPackageFindings(missing), tarballs: new Map() };
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
        manifest,
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
    tarballs: new Map(
      packed.map(({ manifest, tarball }) => [manifest.name, tarball]),
    ),
  };
};

const installFromTarballs = ({ tarballs, tree }) => {
  const path = join(tree, WORKSPACE_FILE);
  writeFileSync(
    path,
    withTarballOverrides({
      tarballs,
      workspaceYaml: readIfPresent(path) ?? '',
    }),
  );
  run(
    'git',
    [
      ...SCRATCH_IDENTITY,
      'commit',
      '--quiet',
      '--no-verify',
      '--message',
      'chore(gate): install the packages packed from the checkout',
      '--',
      WORKSPACE_FILE,
    ],
    tree,
  );
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

const sourceFindings = (tree) => {
  const lockfile = readIfPresent(join(tree, LOCKFILE));
  return lockfile === undefined
    ? [
        `the install wrote no \`${LOCKFILE}\`, so nothing shows where each \`@lcabrera/*\` package came from`,
      ]
    : registryResolvedFindings(lockfile);
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

const PREREQUISITES = [runtimeFindings, installFindings, sourceFindings];

const TREE_CHECKS = [
  blueprintFindings,
  toolchainBinFindings,
  taskRunFindings,
  trackedChangeFindings,
  upgradeFindings,
  commitHookRunFindings,
];

const checkedTree = ({ devkit, staging, tree }) => {
  const { findings, tarballs } = packedPackages({ staging, tree });
  if (findings.length > 0) return findings;
  installFromTarballs({ tarballs, tree });
  return treeFindings({
    checks: TREE_CHECKS,
    context: { devkit },
    prerequisites: PREREQUISITES,
    tree,
  });
};

const main = () => {
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
          : checkedTree({ devkit, staging, tree: join(parent, TREE_NAME) }),
      passed: `Created-workspace gate passed: \`devkit create --profile monorepo\` from the packed tarball placed every blueprint file, the tree installed every \`@lcabrera/*\` package it resolves from a tarball packed from this checkout with ${TOOLCHAIN_BINS.join(', ')} in its \`node_modules/.bin\`, ${tasksLabel()} all exited zero, none of them changed a committed file, \`devkit init --upgrade\` added no task and changed no committed file, and the commit-msg hook took a Conventional Commit and refused a malformed one.`,
      title: 'Created-workspace gate',
    });
  } finally {
    for (const directory of [staging, holder, parent]) {
      rmSync(directory, { force: true, recursive: true });
    }
  }
};

try {
  main();
} catch (error) {
  reportCrash(error);
}
