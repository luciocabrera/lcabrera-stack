#!/usr/bin/env node
/**
 * Raise every `@lcabrera/*` range floor `devkit` ships to the version in this
 * checkout, so a repository created by a release cannot resolve a package
 * older than that release (ADR-117, #1219). A no-op on a tree already in step.
 *
 * Usage (from the repo root): vp run shipped-ranges:raise
 *
 * Exit : 0 when every floor starts at the published version (whether or not it
 *        was rewritten), 1 when a floor cannot be found or raised.
 */
import process from 'node:process';

import { raiseShippedFloors } from './lib/shipped-range-sources.mjs';

const raiseLine = ({ name, path, to }) => `${name} to \`${to}\` in ${path}`;

const summary = (raised) =>
  raised.length === 0
    ? 'raise-shipped-floors: every shipped range already starts at the version this repository publishes\n'
    : `raise-shipped-floors: raised ${raised.map(raiseLine).join(', ')}\n`;

try {
  process.stdout.write(summary(raiseShippedFloors(process.cwd())));
} catch (error) {
  process.stderr.write(
    `raise-shipped-floors: a shipped range floor could not be raised — ${error.message}\n`,
  );
  process.exitCode = 1;
}
