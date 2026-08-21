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
  renderPlan,
} from './command-materialise.mjs';
import { readProfileFlag } from './profile-flag.mjs';

export const runSync = (argv, root) => {
  const { error, profile } = readProfileFlag(argv);
  if (error !== undefined) {
    console.error(error);
    return 1;
  }

  const { entries, manifest } = buildPlan({ profile, root });
  const { reported } = countsFor(entries);

  console.log(renderPlan(entries));

  applyPlan({ entries, manifest, root });

  if (reported > 0) {
    console.log(
      '\nFiles left alone are yours to keep. Re-run after resolving them, or leave them diverged.',
    );
  }
  return 0;
};

/**
 * Records exactly one acknowledgement. The decision is taken in `accepted.mjs`
 * against the plan `doctor` prints, so the refusals are a pure function of that
 * plan and this shell only writes the file.
 */
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
 * `doctor` takes the same `--profile` as `sync`, and has to.
 *
 * Without it the two commands read different sets: a consumer who syncs the
 * wider profile records every file, then CI runs `doctor --check`, the plan is
 * filtered back to the configured profile, and every file outside it is dropped
 * before anything counts it. Delete a hook or hand-edit a workflow and the check
 * exits 0 — the same clean run as a tree with nothing wrong in it.
 *
 * The durable answer is still to set `profile` in `devkit.config.json`, so the
 * two cannot be asked for different things in the first place; the flag is what
 * makes a one-off `doctor` able to agree with a one-off `sync`.
 */
const reportDrift = ({ argv, entries }) => {
  const { reported, written } = countsFor(entries);

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

  const { accepted, entries } = buildPlan({ profile, root });

  const accept = parseAcceptArgs(argv);
  if (accept !== undefined) {
    return runAccept({ accept, accepted, entries, root });
  }

  return reportDrift({ argv, entries });
};
