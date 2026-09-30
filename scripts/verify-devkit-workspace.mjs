/**
 * Creates a `monorepo`-rung tree from the packed `@lcabrera/devkit` tarball,
 * installs it from the registry, and runs the tasks that tree wires for itself.
 * The blueprint's own configs are the only ones that fully lint it, and nothing
 * else here runs them. Both scratch directories sit under the OS temp root so
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
  missingBlueprintFiles,
  nodeFindings,
  outputTail,
  taskFindings,
  TREE_TASKS,
} from './lib/devkit-workspace.mjs';

const REPO_ROOT = process.cwd();

const BLUEPRINT = 'packages/devkit/assets/workspace';

const TREE_NAME = 'made';

const readIfPresent = (path) =>
  existsSync(path) ? readFileSync(path, 'utf8') : undefined;

const readJson = (path) => JSON.parse(readIfPresent(path) ?? '{}');

const execute = ({ args, command, cwd }) => {
  const result = spawnSync(command, args, { cwd, encoding: 'utf8' });
  return {
    output: `${result.stdout ?? ''}${result.stderr ?? ''}${result.error?.message ?? ''}`,
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
    label: `devkit create ${TREE_NAME} --profile monorepo`,
    ...execute({
      args: ['create', TREE_NAME, '--profile', 'monorepo'],
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
    label: 'vp install --no-frozen-lockfile',
    ...execute({
      args: ['install', '--no-frozen-lockfile'],
      command: 'vp',
      cwd: tree,
    }),
  });

const taskRunFindings = (tree) =>
  TREE_TASKS.flatMap(({ args, label }) =>
    taskFindings({ label, ...execute({ args, command: 'vp', cwd: tree }) }),
  );

const TREE_CHECKS = [blueprintFindings, taskRunFindings];

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

    process.stdout.write(
      `Created-workspace gate passed: \`devkit create --profile monorepo\` from the packed tarball placed every blueprint file, the tree installed, and ${TREE_TASKS.map(({ label }) => `\`${label}\``).join(', ')} all exited zero.\n`,
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
  process.stderr.write(
    `${error instanceof Error ? outputTail(`${error.message}\n${error.stderr ?? ''}`) : String(error)}\n`,
  );
  process.exitCode = 1;
}
