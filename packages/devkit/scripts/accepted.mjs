/*
 * The record of which local edits a consumer has said they meant.
 *
 * Why: a materialised file the consumer edited is reported on every run, for
 * ever. That is deliberate — never overwriting an edit is the whole point of the
 * manifest (ADR-081) — but it makes a permanent, intentional customisation
 * indistinguishable from a stale accidental one, and once `doctor --check` runs
 * in CI a repository with a single intended edit has a permanently red gate. The
 * escape from that must not be "stop reporting this file", which is how a real
 * drift later goes unnoticed. So an edit is *acknowledged* instead: quiet by
 * default, never forgotten, and re-surfacing the moment it changes again.
 *
 * An entry is keyed to the file's ON-DISK HASH, not only to its path, and that is
 * the load-bearing part. Editing an acknowledged file changes the hash, the
 * record stops matching, and the file reports as locally modified again with no
 * command to run and no way to forget. A path-keyed record would instead be a
 * permanent opt-out for that path — every future edit to it silently unreported,
 * which is precisely the failure the manifest exists to catch.
 *
 * A sibling file rather than a field inside `.devkit-manifest.json`, for a
 * concrete reason: `sync` rewrites the manifest on every run through a reduce
 * that knows only about `files`, so a field beside it is one unrelated change to
 * manifest writing away from being dropped without a word. It also matches the
 * precedent this borrows its ergonomics from — `verify-docs-paths.mjs --accept`
 * and the tracked `docs-paths-baseline.json` next to the gate that reads it.
 *
 * Shape: `{ "<path>": { "hash": "<sha256>", "reason": "<why>" } }` — flat and
 * keyed by path, because the unit being acknowledged is one materialised file.
 */

import { acknowledgeableStates, isAcknowledgeable } from './manifest.mjs';

export const ACCEPTED_FILE = '.devkit-accepted.json';

const ACCEPT_USAGE =
  'usage: devkit doctor --accept <path> --reason "why this edit is deliberate"';

const isRecordObject = (value) =>
  typeof value === 'object' && value !== null && !Array.isArray(value);

const isReadableEntry = (entry) =>
  isRecordObject(entry) &&
  typeof entry.hash === 'string' &&
  entry.hash !== '' &&
  typeof entry.reason === 'string' &&
  entry.reason.trim() !== '';

export const parseAccepted = (raw) => {
  if (typeof raw !== 'string' || raw.trim() === '') return {};
  try {
    const parsed = JSON.parse(raw);
    if (!isRecordObject(parsed)) return {};
    return Object.fromEntries(
      Object.entries(parsed).filter(([, entry]) => isReadableEntry(entry)),
    );
  } catch {
    return {};
  }
};

export const serialiseAccepted = (accepted) =>
  `${JSON.stringify(
    Object.fromEntries(
      Object.entries(accepted).sort(([left], [right]) =>
        left.localeCompare(right),
      ),
    ),
    undefined,
    2,
  )}\n`;

export const acceptedEntry = ({ accepted, path }) =>
  Object.hasOwn(accepted, path) ? accepted[path] : undefined;

export const isAccepted = ({ accepted, hash, path }) =>
  hash !== undefined && acceptedEntry({ accepted, path })?.hash === hash;

export const withAccepted = (accepted, { hash, path, reason }) => ({
  ...accepted,
  [path]: { hash, reason },
});

const valueAfter = (argv, flag) => {
  const at = argv.indexOf(flag);
  if (at === -1) return undefined;
  const value = argv[at + 1];
  return value === undefined || value.startsWith('--') ? undefined : value;
};

export const parseAcceptArgs = (argv) =>
  argv.includes('--accept')
    ? {
        path: valueAfter(argv, '--accept'),
        reason: valueAfter(argv, '--reason'),
      }
    : undefined;

export const acceptDecision = ({ entries, path, reason }) => {
  const stated = reason === undefined ? '' : reason.trim();
  if (path === undefined || stated === '') return { error: ACCEPT_USAGE };

  const entry = entries.find((candidate) => candidate.path === path);
  if (entry === undefined) {
    return {
      error: `Not a file this kit materialises: ${path}. Only a path devkit placed can be acknowledged.`,
    };
  }
  if (!isAcknowledgeable(entry.state)) {
    return {
      error: `Nothing to acknowledge: ${path} is ${entry.state}. Only a file doctor reports as ${acknowledgeableStates().join(' or ')} can be acknowledged.`,
    };
  }
  return { hash: entry.onDiskHash, reason: stated };
};
