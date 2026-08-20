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
  buildPlan,
  countsFor,
  nextManifestFor,
  renderPlan,
} from './command-materialise.mjs';
import { MANIFEST_FILE, serialiseManifest } from './manifest.mjs';
import { applySync } from './sync.mjs';

const flagValue = (argv, name) => {
  const index = argv.indexOf(name);
  return index === -1 ? undefined : argv[index + 1];
};

export const runSync = (argv, root) => {
  const { entries, manifest } = buildPlan({
    profile: flagValue(argv, '--profile'),
    root,
  });
  const { reported } = countsFor(entries);

  console.log(renderPlan(entries));

  // Called unconditionally. It used to be gated on there being something to
  // write, and that quietly cancelled the wider rule `applySync` follows for a
  // file's MODE: a hook whose bytes still match is `current`, so nothing is
  // written, so the guard skipped the call, so the bit it lost — to a clone with
  // `core.fileMode` off, an unzipped archive, a copy — was never put back. `sync`
  // printed "Everything is up to date", `doctor` reported nothing because the
  // mode is not in the hash, and no command repaired it. Deciding here what
  // `applySync` is for is what made that possible; it decides for itself now.
  applySync({ entries, root });

  // The record is written even when nothing was — a file already identical to
  // the package is adopted into it, and without that a later edit to one reads
  // as an untracked file rather than as drift.
  const updated = serialiseManifest(nextManifestFor({ entries, manifest }));
  if (updated !== serialiseManifest(manifest)) {
    writeFileSync(join(root, MANIFEST_FILE), updated);
  }

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

export const runDoctor = (argv, root) => {
  const { accepted, entries } = buildPlan({ root });

  const accept = parseAcceptArgs(argv);
  if (accept !== undefined) {
    return runAccept({ accept, accepted, entries, root });
  }

  const { reported, written } = countsFor(entries);

  console.log(renderPlan(entries, { verbose: argv.includes('--verbose') }));

  const drifted = written + reported;
  if (drifted === 0 || !argv.includes('--check')) return 0;

  console.error(
    `\n${drifted} file(s) differ from the package. Run devkit sync.`,
  );
  return 1;
};
