/**
 * Parses the usage report's flags and resolves the transcript horizon the flags
 * and `.claude/settings.json` imply.
 *
 * Both jobs are pure decisions over strings, and both have a failure mode the
 * report cannot absorb quietly: a flag whose value was swallowed, and a
 * `cleanupPeriodDays` that is not a number of days. Either one would print a
 * count under a window that did not produce it, which is the one thing this
 * report exists not to do — so both are refused loudly instead.
 *
 * The horizon is only narrowed when a run is deliberately simulating expiry.
 * Reading fewer transcripts than are on disk can only lose invocations that
 * belong in the reported window, so an ordinary run reads all of them.
 */
import { existsSync, readFileSync } from 'node:fs';
import { join } from 'node:path';

import { shiftDay } from './usage-window.mjs';

export const DOCUMENTED_CLEANUP_DEFAULT = 30;

const WHOLE_NUMBER = /^\d+$/u;

const VALUE_FLAGS = new Map([
  ['--days', 'days'],
  ['--now', 'now'],
  ['--out', 'out'],
  ['--snapshot', 'snapshot'],
  ['--transcript-retention-days', 'retentionDays'],
]);

const describeToken = (value) =>
  value === undefined ? 'missing' : `\`${value}\``;

const valueFor = ({ flag, queue }) => {
  const value = queue[0];
  if (value === undefined || value === '--' || value.startsWith('--')) {
    throw new Error(
      `${flag} needs a value, and the next argument is ${describeToken(value)}`,
    );
  }
  return queue.shift();
};

export const parseArgs = (argv) => {
  const queue = [...argv];
  const args = {};
  while (queue.length > 0) {
    const flag = queue.shift();
    if (flag === '--') continue;
    const key = VALUE_FLAGS.get(flag);
    if (key === undefined) {
      throw new Error(
        `unknown argument: ${flag} (see the header comment for usage)`,
      );
    }
    args[key] = valueFor({ flag, queue });
  }
  return args;
};

export const positiveInteger = (value, label) => {
  if (!WHOLE_NUMBER.test(String(value)) || Number.parseInt(value, 10) < 1) {
    throw new Error(
      `${label} must be a positive whole number of days, got \`${value}\``,
    );
  }
  return Number.parseInt(value, 10);
};

const configuredCleanupPeriod = (repoRoot) => {
  const settingsPath = join(repoRoot, '.claude', 'settings.json');
  if (!existsSync(settingsPath)) {
    return { configured: undefined, settingsPath };
  }
  try {
    return {
      configured: JSON.parse(readFileSync(settingsPath, 'utf8'))
        .cleanupPeriodDays,
      settingsPath,
    };
  } catch (error) {
    throw new Error(
      `${settingsPath} is not readable JSON (${error.message}), so the transcript retention it declares cannot be read`,
    );
  }
};

export const resolveRetention = ({ args, repoRoot }) => {
  if (args.retentionDays !== undefined) {
    return {
      days: positiveInteger(args.retentionDays, '--transcript-retention-days'),
      simulated: true,
    };
  }
  const { configured, settingsPath } = configuredCleanupPeriod(repoRoot);
  if (configured === undefined) {
    return { days: DOCUMENTED_CLEANUP_DEFAULT, simulated: false };
  }
  if (!Number.isInteger(configured) || configured < 1) {
    throw new Error(
      `cleanupPeriodDays in ${settingsPath} must be a positive whole number of days, got \`${JSON.stringify(configured)}\``,
    );
  }
  return { days: configured, simulated: false };
};

export const transcriptHorizon = ({ retention, window }) =>
  retention.simulated ? shiftDay(window.end, -(retention.days - 1)) : undefined;
