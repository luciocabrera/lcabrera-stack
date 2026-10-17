/**
 * The created-workspace gate's upgrade check: `devkit init --upgrade` on a tree
 * that `create` and the install just made should find no task to add and no
 * committed file to write, so the check snapshots both before and after.
 */

import { existsSync } from 'node:fs';
import { join } from 'node:path';

import { run } from './devkit-pack.mjs';
import { execute, readJson } from './devkit-tree-run.mjs';
import {
  taskFindings,
  tasksAddedByUpgrade,
  trackedPathsIn,
  trackedWritesByUpgrade,
} from './devkit-workspace.mjs';

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

/**
 * @param {{ devkit: string, tree: string }} args
 * @returns {string[]}
 */
export const upgradeFindings = ({ devkit, tree }) => {
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
