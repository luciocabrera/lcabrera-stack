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

/** An empty string is a mistake, not an override — it would resolve to the host root. */
export const readableString = (value, fallback) =>
  typeof value === 'string' && value.trim() !== '' ? value.trim() : fallback;

/**
 * A configured location that leaves the repository is refused by name rather
 * than normalised into something harmless.
 *
 * These gates write and delete: the ADR scaffolder writes a file, the index
 * regenerates one, the board is overwritten and the claim closer unlinks. A
 * value like `../../etc` survives `join` — it does not "resolve to nothing", it
 * resolves OUTSIDE the host root — and an absolute one silently becomes a
 * subdirectory of it, so a consumer who wrote `/var/claims` would find their
 * claims under `<root>/var/claims` and no error saying why.
 */
/**
 * One spelling per location, because these values are compared as strings, not
 * only joined onto a root: the ADR gate decides whether a file is a stray by
 * asking whether its directory is in the set of configured homes. Declare that
 * home as `docs/decisions/` rather than `docs/decisions` and every ADR in it is
 * reported as a stray — from a trailing slash.
 */
/**
 * Parsed with POSIX semantics on every platform, because the value is checked
 * into git and read wherever the gate runs — a verdict that depends on the
 * host's separator is not a verdict.
 *
 * The platform `normalize` is what makes that a real hazard rather than a
 * tidiness point: on Windows it turns `../../etc` into `..\..\etc`, which the
 * segment check below (splitting on `/`) then reads as a single ordinary name.
 * The containment check would pass and the escape would go through.
 */
const slashed = (value) => value.replaceAll('\\', '/');

const canonical = (value) => {
  // `normalize` has already collapsed any run of separators, so at most one
  // trailing slash can be left — stripped by hand because the regex that does
  // it rescans from every offset (Sonar S8786).
  const normalised = posix.normalize(slashed(value));
  const trimmed = normalised.endsWith('/')
    ? normalised.slice(0, -1)
    : normalised;
  return trimmed === '' ? '.' : trimmed;
};

/** `C:` and `\\server` are roots too, on whichever platform reads the config. */
const DRIVE_OR_UNC = /^(?:[a-z]:|\/\/)/i;

const isRooted = (value) => {
  const withSlashes = slashed(value);
  return posix.isAbsolute(withSlashes) || DRIVE_OR_UNC.test(withSlashes);
};

/** `..` climbs only as a whole segment — `..data` is a name, not a parent. */
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

/**
 * The config as an object, or a failure that names the file.
 *
 * A malformed config is a failure rather than a silent fallback: a consumer who
 * wrote one meant it, and quietly ignoring it would enforce a rule they did not
 * ask for while reporting success. `JSON.parse` says what is wrong but not what
 * it was reading, and the gates print a single line — so its message alone
 * leaves a reader with nothing to open.
 */
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
/** Every entry held to the containment rule, in the order it was declared. */
export const containedList = (value, fallback, key) => {
  if (!Array.isArray(value)) return fallback;
  const entries = value
    .filter((entry) => typeof entry === 'string' && entry.trim() !== '')
    .map((entry) => repoRelative(entry, entry, key));
  return entries.length > 0 ? entries : fallback;
};

/**
 * A list of MATCH FRAGMENTS — substrings, name prefixes, bare directory names —
 * kept exactly as written.
 *
 * Not the same thing as `containedList`, and confusing the two silently narrows
 * a gate. These values are never joined onto the root; they are compared against
 * paths that have already been collected, so there is nothing to escape and
 * nothing to canonicalise. Canonicalising them anyway strips a trailing slash,
 * and that slash is the whole meaning: `reports/` excludes a directory, while
 * `reports` excludes every file whose NAME happens to contain the word — which
 * is how `ADR-049-findings-reports-are-produced-on-demand.md` dropped out of the
 * corpus, taking its checks with it and reporting a clean pass for it.
 */
export const verbatimList = (value, fallback) => {
  if (!Array.isArray(value)) return fallback;
  const entries = value.filter(
    (entry) => typeof entry === 'string' && entry.trim() !== '',
  );
  return entries.length > 0 ? entries : fallback;
};

/** A ceiling has to be a positive whole number of lines; anything else is a typo. */
export const positiveInteger = (value, fallback, key) => {
  if (value === undefined) return fallback;
  if (!Number.isInteger(value) || value <= 0) {
    throw new Error(
      `${CONFIG_FILE_NAME}: \`${key}\` must be a positive whole number, but is \`${JSON.stringify(value)}\`.`,
    );
  }
  return value;
};
