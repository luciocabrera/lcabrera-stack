/**
 * Parses the usage report's flags and resolves the transcript retention that
 * the flags and the Claude Code settings files imply.
 *
 * Both are pure decisions over strings with a failure the report cannot absorb
 * quietly — a flag whose value was swallowed, a `cleanupPeriodDays` that is not
 * a number of days — so both are refused loudly. The resolved value carries the
 * file it came from, because a documented default and a declared number must
 * not be printed as though they had the same authority. The horizon is narrowed
 * only when a run is deliberately simulating expiry.
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

export const settingsFiles = ({ repoRoot, userHome }) => [
  join(repoRoot, '.claude', 'settings.local.json'),
  join(repoRoot, '.claude', 'settings.json'),
  join(userHome, '.claude', 'settings.json'),
];

const declaredCleanupPeriod = (path) => {
  if (!existsSync(path)) {
    return undefined;
  }
  let settings;
  try {
    settings = JSON.parse(readFileSync(path, 'utf8'));
  } catch (error) {
    throw new Error(
      `${path} is not readable JSON (${error.message}), so the transcript retention it declares cannot be read`,
    );
  }
  return settings?.cleanupPeriodDays === undefined
    ? undefined
    : { path, value: settings.cleanupPeriodDays };
};

const firstDeclaration = (paths) => {
  for (const path of paths) {
    const declared = declaredCleanupPeriod(path);
    if (declared !== undefined) {
      return declared;
    }
  }
  return undefined;
};

export const resolveRetention = ({ args, repoRoot, userHome }) => {
  if (args.retentionDays !== undefined) {
    return {
      days: positiveInteger(args.retentionDays, '--transcript-retention-days'),
      simulated: true,
    };
  }
  const declared = firstDeclaration(settingsFiles({ repoRoot, userHome }));
  if (declared === undefined) {
    return { days: DOCUMENTED_CLEANUP_DEFAULT, simulated: false };
  }
  if (!Number.isInteger(declared.value) || declared.value < 1) {
    throw new Error(
      `cleanupPeriodDays in ${declared.path} must be a positive whole number of days, got \`${JSON.stringify(declared.value)}\``,
    );
  }
  return { days: declared.value, declaredIn: declared.path, simulated: false };
};

export const transcriptHorizon = ({ retention, window }) =>
  retention.simulated ? shiftDay(window.end, -(retention.days - 1)) : undefined;
