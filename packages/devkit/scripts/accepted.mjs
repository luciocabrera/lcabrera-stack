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

/**
 * Both fields are required structurally rather than by convention. A hand-added
 * entry carrying no reason is an acknowledgement nobody had to justify, which is
 * exactly the rot `--reason` exists to stop; and an entry whose hash is not a
 * hash matches no file, so it records nothing while reading as a record.
 */
const isReadableEntry = (entry) =>
  isRecordObject(entry) &&
  typeof entry.hash === 'string' &&
  entry.hash !== '' &&
  typeof entry.reason === 'string' &&
  entry.reason.trim() !== '';

/**
 * Reads the record defensively: anything this cannot interpret is treated as no
 * record at all. Same posture as `parseManifest`, and for a sharper reason —
 * trusting a malformed acceptance record fails towards SILENCE, and a file that
 * has quietly stopped being reported is the one state nothing else here can
 * detect.
 */
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

/** Stable key order, so re-recording produces no incidental diff. */
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

/**
 * The acknowledgement recorded for a path, read as an own property so a path
 * spelled like an `Object` member — `constructor` — cannot resolve through the
 * prototype chain into something that looks like a record.
 */
export const acceptedEntry = ({ accepted, path }) =>
  Object.hasOwn(accepted, path) ? accepted[path] : undefined;

/**
 * Whether THIS content at THIS path is the edit that was acknowledged.
 *
 * The hash comparison is the whole mechanism, and the `undefined` guard is what
 * keeps it honest: an absent file has no hash, and reading absent-equals-absent
 * as a match would acknowledge a file nobody has.
 */
export const isAccepted = ({ accepted, hash, path }) =>
  hash !== undefined && acceptedEntry({ accepted, path })?.hash === hash;

/** The record plus exactly one acknowledgement — one file at a time, with its reason. */
export const withAccepted = (accepted, { hash, path, reason }) => ({
  ...accepted,
  [path]: { hash, reason },
});

const valueAfter = (argv, flag) => {
  const at = argv.indexOf(flag);
  if (at === -1) return undefined;
  const value = argv[at + 1];
  // A value that is itself a flag reads as absent, so `--accept --reason "x"`
  // is refused for the fault it actually has — no path — rather than reporting
  // `--reason` as a file nobody edited.
  return value === undefined || value.startsWith('--') ? undefined : value;
};

/** `--accept <path> --reason "<why>"`, or undefined when it was not asked for. */
export const parseAcceptArgs = (argv) =>
  argv.includes('--accept')
    ? {
        path: valueAfter(argv, '--accept'),
        reason: valueAfter(argv, '--reason'),
      }
    : undefined;

/**
 * Whether one acknowledgement may be recorded, and the hash it fixes to.
 *
 * It refuses anything that is not a current finding, the discipline
 * `verify-docs-paths.mjs --accept` already keeps: a pre-emptive or mistyped
 * entry is indistinguishable from an absorbed bug, and both rot into lines
 * nobody dares delete. The plan it is checked against is the one `doctor`
 * prints, so a file already acknowledged is refused too — its state is
 * `acknowledged`, not `modified`. Editing the reason afterwards is an edit to
 * the record, which is a tracked JSON file precisely so that is possible.
 */
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
