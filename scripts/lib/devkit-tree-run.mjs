/**
 * The effects both created-tree gates share: installing an initializer into a
 * holder, running a command in the tree, and reporting what failed. One gate
 * builds the tree from tarballs packed here (verify-devkit-workspace.mjs), the
 * other from what npm serves (verify-devkit-registry.mjs), and both judge it by
 * the same tasks.
 */

import { spawnSync } from 'node:child_process';
import { existsSync, readFileSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import process from 'node:process';

import { run } from './devkit-pack.mjs';
import {
  commandLabel,
  modifiedTrackedFiles,
  nodeFindings,
  outputTail,
  taskFindings,
  TREE_TASKS,
} from './devkit-workspace.mjs';

export const TREE_NAME = 'made';

const INSTALL_ARGS = ['install', '--no-frozen-lockfile'];

const OUTPUT_LIMIT_BYTES = 64 * 1024 * 1024;

/**
 * @param {string} path
 * @returns {string | undefined}
 */
export const readIfPresent = (path) =>
  existsSync(path) ? readFileSync(path, 'utf8') : undefined;

/**
 * @param {string} path
 * @returns {Record<string, unknown>}
 */
export const readJson = (path) => JSON.parse(readIfPresent(path) ?? '{}');

/**
 * @param {{ args: string[], command: string, cwd: string,
 *           env?: NodeJS.ProcessEnv }} args
 * @returns {{ error?: string, output: string, signal: string | null,
 *             status: number | null }}
 */
export const execute = ({ args, command, cwd, env = process.env }) => {
  const result = spawnSync(command, args, {
    cwd,
    encoding: 'utf8',
    env,
    maxBuffer: OUTPUT_LIMIT_BYTES,
  });
  return {
    error: result.error?.message,
    output: [result.stdout, result.stderr].filter(Boolean).join(''),
    signal: result.signal,
    status: result.status,
  };
};

/**
 * @param {{ bin: string, holder: string, spec: string }} args
 * @returns {string}
 */
export const installedBin = ({ bin, holder, spec }) => {
  writeFileSync(
    join(holder, 'package.json'),
    `${JSON.stringify({ name: 'holder', private: true, version: '1.0.0' }, undefined, 2)}\n`,
  );
  run('npm', ['install', '--no-audit', '--no-fund', spec], holder);
  return join(holder, 'node_modules', '.bin', bin);
};

/**
 * @param {{ args: string[], bin: string, parent: string }} args
 * @returns {string[]}
 */
export const createFindings = ({ args, bin, parent }) =>
  taskFindings({
    label: [bin.split('/').at(-1), ...args].join(' '),
    ...execute({ args, command: bin, cwd: parent }),
  });

/**
 * @param {string} tree
 * @returns {string[]}
 */
export const runtimeFindings = (tree) =>
  nodeFindings({
    band: readJson(join(tree, 'package.json')).engines?.node,
    pinned: readIfPresent(join(tree, '.node-version'))?.trim(),
    running: process.versions.node,
  });

/**
 * @param {string} tree
 * @param {NodeJS.ProcessEnv} [env]
 * @returns {string[]}
 */
export const installFindings = (tree, env = process.env) =>
  taskFindings({
    label: commandLabel(INSTALL_ARGS),
    ...execute({ args: INSTALL_ARGS, command: 'vp', cwd: tree, env }),
  });

const PEERS_ARGS = ['peers', 'check'];

/**
 * @param {{ tree: string }} args
 * @returns {string[]}
 */
export const peerFindings = ({ tree }) =>
  taskFindings({
    label: ['pnpm', ...PEERS_ARGS].join(' '),
    ...execute({ args: PEERS_ARGS, command: 'pnpm', cwd: tree }),
  });

/**
 * @param {{ tree: string }} args
 * @returns {string[]}
 */
export const taskRunFindings = ({ tree }) =>
  TREE_TASKS.flatMap((args) =>
    taskFindings({
      label: commandLabel(args),
      ...execute({ args, command: 'vp', cwd: tree }),
    }),
  );

/**
 * @param {{ tree: string }} args
 * @returns {string[]}
 */
export const trackedChangeFindings = ({ tree }) =>
  modifiedTrackedFiles(
    run('git', ['status', '--porcelain', '--untracked-files=no'], tree),
  );

/**
 * @param {{ checks: ReadonlyArray<(context: Record<string, string>) =>
 *             string[] | Promise<string[]>>,
 *           context?: Record<string, string>,
 *           prerequisites: ReadonlyArray<(tree: string) => string[]>,
 *           tree: string }} args
 * @returns {Promise<string[]>}
 */
export const treeFindings = async ({
  checks,
  context = {},
  prerequisites,
  tree,
}) => {
  const blocking = prerequisites.reduce(
    (found, check) => (found.length > 0 ? found : check(tree)),
    [],
  );
  if (blocking.length > 0) return blocking;
  return checks.reduce(
    async (earlier, check) => [
      ...(await earlier),
      ...(await check({ ...context, tree })),
    ],
    Promise.resolve([]),
  );
};

/**
 * @param {{ findings: readonly string[], passed: string, title: string }} args
 */
export const report = ({ findings, passed, title }) => {
  if (findings.length === 0) {
    process.stdout.write(`${passed}\n`);
    return;
  }
  process.stderr.write(`\n${title} — ${findings.length} finding(s):\n\n`);
  for (const finding of findings) process.stderr.write(`  • ${finding}\n`);
  process.exitCode = 1;
};

/**
 * @param {unknown} error
 */
export const reportCrash = (error) => {
  const detail =
    error instanceof Error
      ? outputTail([error.message, error.stderr ?? ''].join('\n'))
      : String(error);
  process.stderr.write(`${detail}\n`);
  process.exitCode = 1;
};

/**
 * @returns {string}
 */
export const tasksLabel = () =>
  TREE_TASKS.map((args) => commandLabel(args)).join(', ');
