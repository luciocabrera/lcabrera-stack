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
  ACCEPTED_FILE,
  acceptDecision,
  parseAcceptArgs,
  serialiseAccepted,
  withAccepted,
} from './accepted.mjs';
import {
  applyPlan,
  buildPlan,
  countsFor,
  printPlacementNotice,
  renderPlan,
} from './command-materialise.mjs';
import { readProfileFlag } from './profile-flag.mjs';

export const runSync = (argv, root) => {
  const { error, profile } = readProfileFlag(argv);
  if (error !== undefined) {
    console.error(error);
    return 1;
  }

  const { config, entries, manifest } = buildPlan({ profile, root });
  const { reported } = countsFor(entries);

  printPlacementNotice(config.profile);
  console.log(renderPlan(entries));

  applyPlan({ entries, manifest, root });

  if (reported > 0) {
    console.log(
      '\nFiles left alone are yours to keep. Re-run after resolving them, or leave them diverged.',
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

const reportDrift = ({ argv, config, entries }) => {
  const { reported, written } = countsFor(entries);

  printPlacementNotice(config.profile);
  console.log(renderPlan(entries, { verbose: argv.includes('--verbose') }));

  const drifted = written + reported;
  if (drifted === 0 || !argv.includes('--check')) return 0;

  console.error(
    `\n${drifted} file(s) differ from the package. Run devkit sync.`,
  );
  return 1;
};

export const runDoctor = (argv, root) => {
  const { error, profile } = readProfileFlag(argv);
  if (error !== undefined) {
    console.error(error);
    return 1;
  }

  const { accepted, config, entries } = buildPlan({ profile, root });

  const accept = parseAcceptArgs(argv);
  if (accept !== undefined) {
    return runAccept({ accept, accepted, entries, root });
  }

  return reportDrift({ argv, config, entries });
};
