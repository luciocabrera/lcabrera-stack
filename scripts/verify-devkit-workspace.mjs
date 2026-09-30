/**
 * Creates a `monorepo`-rung tree from the packed `@lcabrera/devkit` tarball,
 * installs it from the registry, and runs the tasks that tree wires for itself.
 * The blueprint's own configs are the only ones that fully lint it, and nothing
 * else here runs them. Every scratch directory sits under the OS temp root so
 * the tree inherits nothing from this checkout (ADR-073).
 *
 * Usage: node scripts/verify-devkit-workspace.mjs
 * Exit codes: 0 = the created tree installs and its tasks pass, 1 = it does not.
 */

import { spawnSync } from 'node:child_process';
import {
  existsSync,
  mkdtempSync,
  readFileSync,
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
  commandLabel,
  missingBlueprintFiles,
  modifiedTrackedFiles,
  nodeFindings,
  outputTail,
  taskFindings,
  TREE_TASKS,
} from './lib/devkit-workspace.mjs';

const REPO_ROOT = process.cwd();

const BLUEPRINT = 'packages/devkit/assets/workspace';

const TREE_NAME = 'made';

const CREATE_ARGS = ['create', TREE_NAME, '--profile', 'monorepo'];

const INSTALL_ARGS = ['install', '--no-frozen-lockfile'];

const readIfPresent = (path) =>
  existsSync(path) ? readFileSync(path, 'utf8') : undefined;

const readJson = (path) => JSON.parse(readIfPresent(path) ?? '{}');

const OUTPUT_LIMIT_BYTES = 64 * 1024 * 1024;

const execute = ({ args, command, cwd }) => {
  const result = spawnSync(command, args, {
    cwd,
    encoding: 'utf8',
    maxBuffer: OUTPUT_LIMIT_BYTES,
  });
  return {
    error: result.error?.message,
    output: [result.stdout, result.stderr].filter(Boolean).join(''),
    signal: result.signal,
    status: result.status,
  };
};

const installedDevkit = ({ holder, staging }) => {
  const { tarball } = packOne({
    directory: 'devkit',
    into: staging,
    repoRoot: REPO_ROOT,
  });
  writeFileSync(
    join(holder, 'package.json'),
    `${JSON.stringify({ name: 'holder', private: true, version: '1.0.0' }, undefined, 2)}\n`,
  );
  run('npm', ['install', '--no-audit', '--no-fund', tarball], holder);
  return join(holder, 'node_modules', '.bin', 'devkit');
};

const createFindings = ({ devkit, parent }) =>
  taskFindings({
    label: ['devkit', ...CREATE_ARGS].join(' '),
    ...execute({
      args: CREATE_ARGS,
      command: devkit,
      cwd: parent,
    }),
  });

const blueprintFindings = (tree) =>
  missingBlueprintFiles({
    blueprint: run('git', ['ls-files', '--', '.'], join(REPO_ROOT, BLUEPRINT))
      .split('\n')
      .filter((line) => line !== ''),
    placed: Object.keys(readJson(join(tree, '.devkit-manifest.json')).files),
    targetOf: (path) =>
      targetPathFor({ assetPath: `workspace/${path}`, config: DEFAULT_CONFIG }),
  });

const runtimeFindings = (tree) =>
  nodeFindings({
    band: readJson(join(tree, 'package.json')).engines?.node,
    pinned: readIfPresent(join(tree, '.node-version'))?.trim(),
    running: process.versions.node,
  });

const installFindings = (tree) =>
  taskFindings({
    label: commandLabel(INSTALL_ARGS),
    ...execute({
      args: INSTALL_ARGS,
      command: 'vp',
      cwd: tree,
    }),
  });

const taskRunFindings = (tree) =>
  TREE_TASKS.flatMap((args) =>
    taskFindings({
      label: commandLabel(args),
      ...execute({ args, command: 'vp', cwd: tree }),
    }),
  );

const trackedChangeFindings = (tree) =>
  modifiedTrackedFiles(
    run('git', ['status', '--porcelain', '--untracked-files=no'], tree),
  );

const TREE_CHECKS = [blueprintFindings, taskRunFindings, trackedChangeFindings];

const PREREQUISITES = [runtimeFindings, installFindings];

const firstBlocking = (tree) =>
  PREREQUISITES.reduce(
    (found, check) => (found.length > 0 ? found : check(tree)),
    [],
  );

const treeFindings = (tree) => {
  const blocking = firstBlocking(tree);
  return blocking.length > 0
    ? blocking
    : TREE_CHECKS.flatMap((check) => check(tree));
};

const main = () => {
  const staging = mkdtempSync(join(tmpdir(), 'devkit-workspace-pack-'));
  const holder = mkdtempSync(join(tmpdir(), 'devkit-workspace-holder-'));
  const parent = mkdtempSync(join(tmpdir(), 'devkit-workspace-tree-'));
  const tree = join(parent, TREE_NAME);

  try {
    const devkit = installedDevkit({ holder, staging });
    const created = createFindings({ devkit, parent });
    const findings = created.length > 0 ? created : treeFindings(tree);

    if (findings.length > 0) {
      process.stderr.write(
        `\nCreated-workspace gate — ${findings.length} finding(s):\n\n`,
      );
      for (const finding of findings) process.stderr.write(`  • ${finding}\n`);
      process.exitCode = 1;
      return;
    }

    const tasks = TREE_TASKS.map((args) => commandLabel(args)).join(', ');
    process.stdout.write(
      `Created-workspace gate passed: \`devkit create --profile monorepo\` from the packed tarball placed every blueprint file, the tree installed, ${tasks} all exited zero, and none of them changed a committed file.\n`,
    );
  } finally {
    for (const directory of [staging, holder, parent]) {
      rmSync(directory, { force: true, recursive: true });
    }
  }
};

try {
  main();
} catch (error) {
  const detail =
    error instanceof Error
      ? outputTail([error.message, error.stderr ?? ''].join('\n'))
      : String(error);
  process.stderr.write(`${detail}\n`);
  process.exitCode = 1;
}
