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
  const { reported, written } = countsFor(entries);

  console.log(renderPlan(entries));

  if (written > 0) applySync({ entries, root });

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

export const runDoctor = (argv, root) => {
  const { entries } = buildPlan({ root });
  const { reported, written } = countsFor(entries);

  console.log(renderPlan(entries));

  const drifted = written + reported;
  if (drifted === 0 || !argv.includes('--check')) return 0;

  console.error(
    `\n${drifted} file(s) differ from the package. Run devkit sync.`,
  );
  return 1;
};
