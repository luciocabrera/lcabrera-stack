/**
 * Deletes the coordination task file(s) a merged PR closed, so nobody has to
 * remember Rule 12's last step. A claim outliving its merge is read as a live
 * soft lock and fences the next agent off work that already landed.
 *
 * Matching is `./lib/coordination-close.mjs` (pure); committing the deletion is
 * `.github/workflows/coordination-close.yml`. This file is only the effect
 * between them. See `.claude/rules/scripts.md`.
 *
 * Usage (from the repo root):
 *   vp run coordination:close -- --pr <number> [--branch <head-ref>] [--dry-run]
 *   node scripts/close-coordination-claim.mjs --pr 533 --dry-run
 *
 * Exit codes: 0 = the resolved files were deleted, or nothing claimed this PR
 * (the common case is a no-op, not a failure); 1 = neither signal was given, or
 * a delete failed.
 */
import { unlinkSync } from 'node:fs';
import { join, resolve } from 'node:path';
import process from 'node:process';
import { fileURLToPath } from 'node:url';

import { flagValue } from '@repo/repo-standards/cli-input';
import { tasksClosedBy } from './lib/coordination-close.mjs';
import { readEntries } from '@repo/repo-standards/coordination-read';

const REPO_ROOT = resolve(fileURLToPath(import.meta.url), '../..');
const TASKS_DIR = join(REPO_ROOT, 'docs', 'coordination', 'tasks');
const TASKS_REL = 'docs/coordination/tasks';

const USAGE =
  'usage: node scripts/close-coordination-claim.mjs --pr <number> ' +
  '[--branch <head-ref>] [--dry-run]';

/** What was searched for, so a no-op says which PR it found no claim for
 *  rather than just "nothing to do". */
const describeSignals = (prNumber, headRef) =>
  [
    prNumber === undefined ? undefined : `PR #${prNumber}`,
    headRef === undefined ? undefined : `branch \`${headRef}\``,
  ]
    .filter(Boolean)
    .join(' / ');

const main = () => {
  const prNumber = flagValue('--pr');
  const headRef = flagValue('--branch');
  const dryRun = process.argv.includes('--dry-run');

  if (prNumber === undefined && headRef === undefined) {
    console.error(`${USAGE}\n\nGive at least one of --pr / --branch.`);
    process.exitCode = 1;
    return;
  }

  const closed = tasksClosedBy({
    entries: readEntries(TASKS_DIR),
    headRef,
    prNumber,
  });

  if (closed.length === 0) {
    console.log(
      `No coordination task claims ${describeSignals(prNumber, headRef)} — nothing to close.`,
    );
    return;
  }

  for (const { name } of closed) {
    if (!dryRun) {
      unlinkSync(join(TASKS_DIR, name));
    }
    console.log(
      `${dryRun ? 'Would delete' : 'Deleted'} ${TASKS_REL}/${name} (claimed ${describeSignals(prNumber, headRef)}).`,
    );
  }

  if (dryRun) {
    console.log(`\n--dry-run: ${closed.length} file(s) left in place.`);
  }
};

try {
  main();
} catch (error) {
  console.error(error.message);
  process.exitCode = 1;
}
