/**
 * Creates a tree with the published `create-lcabrera-stack` at its default
 * rung, `full`, and lets it install from npm itself — what a user who runs the
 * initializer today actually gets — then checks its peers, runs the tasks that
 * tree wires for itself, seeds its database and runs its smoke tests. The
 * database is the one `DEVKIT_TREE_DB_HOST` names, else the tree's own `db:up`
 * (Docker), so create is told `--no-db`. `workspace:verify` packs this
 * checkout instead, so it proves the next release and not the registry; this
 * runs right after a publish, so the install lifts pnpm's minimum release age,
 * which would otherwise resolve the release before it.
 *
 * Usage: node scripts/verify-devkit-registry.mjs
 * Exit codes: 0 = the created tree installs and its tasks pass, 1 = it does not.
 */

import { mkdtempSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';

import { databaseLane } from './lib/devkit-tree-run-database.mjs';
import {
  createFindings,
  installedBin,
  peerFindings,
  registryCreateEnv,
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

const CREATE_ARGS = [TREE_NAME, '--no-db'];

const PREREQUISITES = [runtimeFindings];

const main = async () => {
  const holder = mkdtempSync(join(tmpdir(), 'devkit-registry-holder-'));
  const parent = mkdtempSync(join(tmpdir(), 'devkit-registry-tree-'));
  const database = databaseLane();

  try {
    const initializer = installedBin({
      bin: INITIALIZER,
      holder,
      spec: `${INITIALIZER}@latest`,
    });
    const created = createFindings({
      args: CREATE_ARGS,
      bin: initializer,
      env: registryCreateEnv(),
      parent,
    });
    report({
      findings:
        created.length > 0
          ? created
          : await treeFindings({
              checks: [
                peerFindings,
                taskRunFindings,
                database.prepared,
                trackedChangeFindings,
              ],
              prerequisites: PREREQUISITES,
              tree: join(parent, TREE_NAME),
            }),
      passed: `Registry created-workspace gate passed: the published \`${INITIALIZER}\` created a full-rung tree and installed it from npm with no unmet peer, ${tasksLabel()} all exited zero, the tree's seed and smoke tests passed against its database, and none of them changed a committed file.`,
      title: 'Registry created-workspace gate',
    });
  } finally {
    database.teardown();
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
