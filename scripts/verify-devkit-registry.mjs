/**
 * Creates a `monorepo`-rung tree with the published `create-lcabrera-stack`,
 * installs it from npm, checks its peers, and runs the tasks that tree wires for itself — what a
 * user who runs the initializer today actually gets. `workspace:verify` packs
 * this checkout instead, so it proves the next release and not the registry;
 * this runs right after a publish, so the tree's install lifts pnpm's
 * minimum release age, which would otherwise resolve the release before it.
 *
 * Usage: node scripts/verify-devkit-registry.mjs
 * Exit codes: 0 = the created tree installs and its tasks pass, 1 = it does not.
 */

import { mkdtempSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';

import {
  createFindings,
  installedBin,
  peerFindings,
  registryInstallFindings,
  report,
  reportCrash,
  runtimeFindings,
  taskRunFindings,
  tasksLabel,
  trackedChangeFindings,
  TREE_NAME,
  treeFindings,
} from './lib/devkit-tree-run.mjs';

const INITIALIZER = 'create-lcabrera-stack';

const CREATE_ARGS = [TREE_NAME, '--profile', 'monorepo'];

const PREREQUISITES = [runtimeFindings, registryInstallFindings];

const TREE_CHECKS = [peerFindings, taskRunFindings, trackedChangeFindings];

const main = async () => {
  const holder = mkdtempSync(join(tmpdir(), 'devkit-registry-holder-'));
  const parent = mkdtempSync(join(tmpdir(), 'devkit-registry-tree-'));

  try {
    const initializer = installedBin({
      bin: INITIALIZER,
      holder,
      spec: `${INITIALIZER}@latest`,
    });
    const created = createFindings({
      args: CREATE_ARGS,
      bin: initializer,
      parent,
    });
    report({
      findings:
        created.length > 0
          ? created
          : await treeFindings({
              checks: TREE_CHECKS,
              prerequisites: PREREQUISITES,
              tree: join(parent, TREE_NAME),
            }),
      passed: `Registry created-workspace gate passed: the published \`${INITIALIZER}\` created a monorepo-rung tree, it installed from npm with no unmet peer, ${tasksLabel()} all exited zero, and none of them changed a committed file.`,
      title: 'Registry created-workspace gate',
    });
  } finally {
    for (const directory of [holder, parent]) {
      rmSync(directory, { force: true, recursive: true });
    }
  }
};

try {
  await main();
} catch (error) {
  reportCrash(error);
}
