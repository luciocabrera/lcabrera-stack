/*
 * The `sync` and `doctor` commands.
 *
 * They share a plan and differ only in what they do with it, which is the point:
 * a doctor that computed its answer by a different route than the command it
 * predicts would be worse than no doctor, because it would be believed.
 */

import { writeFileSync } from 'node:fs';
import { join } from 'node:path';

import {
  acceptDecision,
  ACCEPTED_FILE,
  parseAcceptArgs,
  serialiseAccepted,
  withAccepted,
} from './accepted.mjs';
import {
  applyPlan,
  buildPlan,
  countsFor,
  printPlacementNotice,
  printTaskPlan,
  renderPlan,
  unresolvedNotice,
} from './command-materialise.mjs';
import { readProfileFlag } from './profile-flag.mjs';
import { taskCounts } from './tasks.mjs';

export const runSync = (argv, root) => {
  const { error, profile } = readProfileFlag(argv);
  if (error !== undefined) {
    console.error(error);
    return 1;
  }

  const { config, entries, manifest, tasks } = buildPlan({ profile, root });
  const reported = countsFor(entries).reported + taskCounts(tasks).reported;

  printPlacementNotice(config.profile);
  console.log(renderPlan(entries));
  printTaskPlan(tasks);

  applyPlan({ entries, manifest, root, tasks });

  const unresolved = unresolvedNotice(entries);
  if (unresolved !== undefined) console.error(`\n${unresolved}`);
  if (reported > 0) {
    console.log(
      '\nWhat was left alone is yours to keep. Re-run after resolving it, or leave it diverged.',
    );
  }
  return 0;
};

const runAccept = ({ accept, accepted, entries, root }) => {
  const decision = acceptDecision({
    entries,
    path: accept.path,
    reason: accept.reason,
  });
  if (decision.error !== undefined) {
    console.error(decision.error);
    return 1;
  }

  writeFileSync(
    join(root, ACCEPTED_FILE),
    serialiseAccepted(
      withAccepted(accepted, {
        hash: decision.hash,
        path: accept.path,
        reason: decision.reason,
      }),
    ),
  );
  console.log(
    `Acknowledged ${accept.path} — ${decision.reason}\nEdit it again and it is reported again; ${ACCEPTED_FILE} is a tracked record, so commit it.`,
  );
  return 0;
};

/**
 * What to tell a reader whose repository has drifted.
 *
 * `sync` is the answer to almost all of it and to none of an unanswered command
 * key, so the two sentences are composed rather than printed one after the
 * other: sending someone to a command that cannot change what they are reading
 * about is the one thing this report must not do.
 *
 * @param {{ unresolved?: string, writable: number }} args
 * @returns {string}
 */
const driftAdvice = ({ unresolved, writable }) => {
  if (unresolved === undefined) return 'Run devkit sync.';
  return writable > 0
    ? `Run devkit sync for the rest.\n${unresolved}`
    : `Running devkit sync would change none of them.\n${unresolved}`;
};

const reportDrift = ({ argv, config, entries, tasks }) => {
  const files = countsFor(entries);
  const taskDrift = taskCounts(tasks);

  printPlacementNotice(config.profile);
  console.log(renderPlan(entries, { verbose: argv.includes('--verbose') }));
  printTaskPlan(tasks);

  const writable = files.written + taskDrift.written;
  const drifted = writable + files.reported + taskDrift.reported;
  if (drifted === 0 || !argv.includes('--check')) return 0;

  console.error(
    `\n${drifted} item(s) differ from the package. ${driftAdvice({
      unresolved: unresolvedNotice(entries),
      writable,
    })}`,
  );
  return 1;
};

export const runDoctor = (argv, root) => {
  const { error, profile } = readProfileFlag(argv);
  if (error !== undefined) {
    console.error(error);
    return 1;
  }

  const { accepted, config, entries, tasks } = buildPlan({ profile, root });

  const accept = parseAcceptArgs(argv);
  if (accept !== undefined) {
    return runAccept({ accept, accepted, entries, root });
  }

  return reportDrift({ argv, config, entries, tasks });
};
