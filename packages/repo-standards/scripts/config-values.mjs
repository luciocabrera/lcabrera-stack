/*
 * Turning a raw config value into one a gate can act on, and refusing the ones
 * it must not.
 *
 * Split out of `config.mjs` when the ADR gate's own baseline joined the
 * register: that file was within a handful of lines of the 350-line ceiling, and
 * these coercions are the half of it that answers a question about a VALUE
 * rather than about a block. Nothing here reads the filesystem.
 *
 * Every rule below is here because getting it wrong is silent. A path that
 * leaves the repository still `join`s; a trailing slash still parses; a
 * `normalize` that respects the host separator still returns a string.
 */

import { posix } from 'node:path';

import { errorMessage } from './error-message.mjs';

export const CONFIG_FILE_NAME = 'devkit.config.json';

export const isPlainObject = (value) =>
  typeof value === 'object' && value !== null && !Array.isArray(value);

export const readableString = (value, fallback) =>
  typeof value === 'string' && value.trim() !== '' ? value.trim() : fallback;

const slashed = (value) => value.replaceAll('\\', '/');

const canonical = (value) => {
  const normalised = posix.normalize(slashed(value));
  const trimmed = normalised.endsWith('/')
    ? normalised.slice(0, -1)
    : normalised;
  return trimmed === '' ? '.' : trimmed;
};

const DRIVE_OR_UNC = /^(?:[a-z]:|\/\/)/i;

const isRooted = (value) => {
  const withSlashes = slashed(value);
  return posix.isAbsolute(withSlashes) || DRIVE_OR_UNC.test(withSlashes);
};

const leavesRoot = (candidate) => candidate.split('/')[0] === '..';

export const repoRelative = (value, fallback, key) => {
  const raw = readableString(value, fallback);
  if (isRooted(raw)) {
    throw new Error(
      `${CONFIG_FILE_NAME}: \`${key}\` must be relative to the repository root, but is \`${raw}\`.`,
    );
  }
  const candidate = canonical(raw);
  if (leavesRoot(candidate)) {
    throw new Error(
      `${CONFIG_FILE_NAME}: \`${key}\` must stay inside the repository, but \`${raw}\` leaves it.`,
    );
  }
  return candidate;
};

export const parseConfig = (raw) => {
  let parsed;
  try {
    parsed = JSON.parse(raw);
  } catch (error) {
    throw new Error(
      `${CONFIG_FILE_NAME} is not valid JSON: ${errorMessage(error)}`,
    );
  }
  if (!isPlainObject(parsed)) {
    throw new Error(`${CONFIG_FILE_NAME} must contain a JSON object`);
  }
  return parsed;
};
export const rejectMalformed = ({ entries, isValid, key, requirement }) => {
  const malformed = entries.filter((entry) => !isValid(entry));
  if (malformed.length > 0) {
    throw new Error(
      `${CONFIG_FILE_NAME}: every entry in \`${key}\` ${requirement}, but these do not: ${malformed
        .map((entry) => JSON.stringify(entry) ?? String(entry))
        .join(', ')}.`,
    );
  }
  return entries;
};

const isNamed = (entry) => typeof entry === 'string' && entry.trim() !== '';

const NAMED = 'must be a non-empty string';

export const containedList = (value, fallback, key) => {
  if (!Array.isArray(value)) return fallback;
  const entries = rejectMalformed({
    entries: value,
    isValid: isNamed,
    key,
    requirement: NAMED,
  }).map((entry) => repoRelative(entry, entry, key));
  return entries.length > 0 ? entries : fallback;
};

export const verbatimList = (value, fallback, key) => {
  if (!Array.isArray(value)) return fallback;
  const entries = rejectMalformed({
    entries: value,
    isValid: isNamed,
    key,
    requirement: NAMED,
  });
  return entries.length > 0 ? entries : fallback;
};

const compiled = (source) => {
  try {
    return new RegExp(source, 'u');
  } catch {
    return undefined;
  }
};

export const patternList = (value, fallback, key) => {
  const entries = verbatimList(value, fallback, key);
  const broken = entries.filter((source) => compiled(source) === undefined);
  if (broken.length > 0) {
    throw new Error(
      `${CONFIG_FILE_NAME}: \`${key}\` must hold regular expressions, but these do not compile: ${broken.join(', ')}.`,
    );
  }
  return entries;
};

export const positiveInteger = (value, fallback, key) => {
  if (value === undefined) return fallback;
  if (!Number.isInteger(value) || value <= 0) {
    throw new Error(
      `${CONFIG_FILE_NAME}: \`${key}\` must be a positive whole number, but is \`${JSON.stringify(value)}\`.`,
    );
  }
  return value;
};
