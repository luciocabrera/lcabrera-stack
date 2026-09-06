#!/usr/bin/env node
/**
 * Fails the build when a `*.util.ts`/`*.util.tsx` value export (`export
 * const`/`export function` — a type-only export is out of scope, see
 * `lib/inventory-drift.mjs`) is not named anywhere in its package's own
 * `INVENTORY.md`.
 *
 * Why this exists: AGENTS.md § "Reuse Before You Build" makes the inventories
 * (`gates.inventory.trees`) mandatory reading before writing anything new, but
 * nothing failed when an artifact was added without its entry. Closing #579
 * found nineteen such gaps, some a year old; #811 fixed them and named this
 * gate in its own retrospective. The matching rule — a name in backticks
 * anywhere in the file, not "has its own row" — and why the scope stops at
 * `.util.ts` are in `lib/inventory-drift.mjs`. See #817.
 *
 * Pre-existing gaps beyond what #811 already closed are grandfathered in
 * `gates.inventory.baselineFile` (`script-size-baseline.json`
 * semantics): `--write` regenerates it from the current findings, so it can
 * both shrink (a gap gets documented) and grow (a genuine new gap is
 * accepted) — reviewed as a JSON diff, same as that file.
 *
 * Usage:
 *   repo-verify-inventory            check, exit 1 on new drift
 *   repo-verify-inventory --write    regenerate the baseline
 *
 * Exit codes: 0 = every value export is documented or grandfathered, 1 = a
 * new, undocumented value export exists, or the tracked file list could not
 * be read.
 */
import { existsSync, readFileSync, writeFileSync } from 'node:fs';
import { dirname, join, relative } from 'node:path';
import { fileURLToPath } from 'node:url';

import { readGates } from './config.mjs';
import { errorMessage } from './error-message.mjs';
import { runGit } from './git-exec.mjs';
import { resolveHostRoot } from './host-root.mjs';
import {
  describeFinding,
  describeStaleEntry,
  isBaselined,
  missingExports,
  staleBaselineEntries,
  toBaseline,
  utilFileEntries,
} from './inventory-drift.mjs';

const REPO_ROOT = resolveHostRoot({
  moduleDirectory: dirname(fileURLToPath(import.meta.url)),
});
const { baselineFile: BASELINE_FILE, trees: INVENTORY_TREES } =
  readGates(REPO_ROOT).inventory;
const BASELINE_PATH = join(REPO_ROOT, BASELINE_FILE);

const trackedPaths = () => {
  const output = runGit({ args: ['ls-files'], cwd: REPO_ROOT });
  if (output === undefined || output.trim() === '') {
    throw new Error(
      'Inventory gate: could not list tracked files. Refusing to report a clean pass on no data.',
    );
  }
  return output.split('\n').filter((line) => line !== '');
};

const readEntries = (paths) =>
  utilFileEntries(paths, INVENTORY_TREES).map((entry) => ({
    ...entry,
    source: readFileSync(join(REPO_ROOT, entry.file), 'utf8'),
  }));

const readInventoryTextByTree = () =>
  new Map(
    INVENTORY_TREES.map((tree) => [
      tree.root,
      readFileSync(join(REPO_ROOT, tree.inventory), 'utf8'),
    ]),
  );

const readBaseline = () =>
  existsSync(BASELINE_PATH)
    ? JSON.parse(readFileSync(BASELINE_PATH, 'utf8'))
    : {};

const writeBaseline = (findings) => {
  writeFileSync(
    BASELINE_PATH,
    `${JSON.stringify(toBaseline(findings), undefined, 2)}\n`,
  );
  const relativeBaselinePath = relative(REPO_ROOT, BASELINE_PATH);
  console.log(
    `Wrote ${relativeBaselinePath}: ${findings.length} undocumented export(s) grandfathered.`,
  );
};

const printStaleWarnings = (stale) => {
  for (const finding of stale) {
    const line = `${describeStaleEntry(finding)} — drop it with --write.`;
    console.error(
      process.env.GITHUB_ACTIONS === 'true'
        ? `::warning::${line}`
        : `  ⚠ ${line}`,
    );
  }
};

const reportNewFindings = (findings) => {
  console.error(
    `Inventory gate — ${findings.length} export(s) not named in their tree's INVENTORY.md:\n`,
  );
  for (const finding of findings) {
    console.error(`  - ${describeFinding(finding)}`);
  }
  console.error(
    '\nAdd it to the inventory (a table row for `ui`/the app, or a backtick',
  );
  console.error(
    'mention in the relevant prose for `server`) — see AGENTS.md § "Reuse',
  );
  console.error('Before You Build".');
  console.error(
    'Pre-existing gap this gate should not block on right now? Grandfather it with:',
  );
  console.error('  repo-verify-inventory --write');
};

const main = () => {
  if (INVENTORY_TREES.length === 0) {
    throw new Error(
      'Inventory gate: `gates.inventory.trees` names no tree in devkit.config.json. Refusing to report a clean pass over no inventory.',
    );
  }
  const entries = readEntries(trackedPaths());
  const inventoryTextByTree = readInventoryTextByTree();
  const findings = missingExports(entries, inventoryTextByTree);

  if (process.argv.includes('--write')) {
    writeBaseline(findings);
    return;
  }

  const baseline = readBaseline();
  printStaleWarnings(staleBaselineEntries(baseline, findings));

  const introduced = findings.filter(
    ({ file, symbol }) => !isBaselined(baseline, file, symbol),
  );
  if (introduced.length > 0) {
    reportNewFindings(introduced);
    process.exitCode = 1;
    return;
  }

  const grandfathered = Object.values(baseline).flat().length;
  console.log(
    `Inventory gate passed: ${entries.length} util file(s) checked across ${INVENTORY_TREES.length} tree(s), ${grandfathered} grandfathered.`,
  );
};

try {
  main();
} catch (error) {
  console.error(errorMessage(error));
  process.exitCode = 1;
}
