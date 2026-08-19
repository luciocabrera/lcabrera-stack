/*
 * The record of what this kit put in a consumer's tree, and the rules for what
 * happens to each file on the next run.
 *
 * Why a manifest at all: copying a directory is not distribution, because it
 * has no update path in either direction. Recording a hash per file is what
 * separates "the consumer has not touched this, so an upstream fix is safe to
 * apply" from "they edited it, and overwriting would destroy their work" — a
 * distinction a plain copy cannot make, so it either clobbers everything or
 * updates nothing.
 *
 * A deliberate local edit is a supported state, not a defect. It is reported on
 * every run and never overwritten, which is the escape valve that stops a
 * consumer forking the kit to change one line.
 */

import { createHash } from 'node:crypto';

export const MANIFEST_FILE = '.devkit-manifest.json';
export const MANIFEST_VERSION = 1;

export const hashContent = (content) =>
  createHash('sha256').update(content).digest('hex');

/**
 * What to do with one file, given what upstream has, what the tree has, and
 * what was last written.
 *
 * `undefined` for on-disk means absent; `undefined` for recorded means this kit
 * has never written that path — which is why an unmanaged file already sitting
 * there is a `conflict` rather than something to overwrite. Adopting a path the
 * consumer wrote themselves is the one mistake a materialiser cannot undo.
 */
export const classifyMaterialisation = ({
  incomingHash,
  onDiskHash,
  recordedHash,
}) => {
  if (recordedHash === undefined) {
    if (onDiskHash === undefined) return 'added';
    return onDiskHash === incomingHash ? 'current' : 'conflict';
  }
  if (onDiskHash === undefined) return 'restored';
  if (onDiskHash !== recordedHash) return 'modified';
  return incomingHash === recordedHash ? 'current' : 'updated';
};

/** The states whose file is written; everything else leaves the tree alone. */
const WRITTEN_STATES = new Set(['added', 'restored', 'updated']);

export const isWritten = (state) => WRITTEN_STATES.has(state);

/**
 * Recording is wider than writing: a file already identical to the package is
 * provably the package's content, so it is adopted into the record even though
 * nothing was written. Leaving it unrecorded would mean a later edit to it read
 * as an untracked file rather than as drift — which is the one thing the record
 * exists to catch.
 */
const RECORDED_STATES = new Set(['added', 'current', 'restored', 'updated']);

export const isRecorded = (state) => RECORDED_STATES.has(state);

/** The states a consumer needs to see: their edit survived, or was refused. */
const REPORTED_STATES = new Set(['conflict', 'modified']);

export const isReported = (state) => REPORTED_STATES.has(state);

export const emptyManifest = (version) => ({
  files: {},
  packageVersion: version,
  version: MANIFEST_VERSION,
});

/**
 * Reads a manifest defensively: an unreadable or future-versioned one is
 * treated as absent, so a consumer whose manifest was hand-edited or written by
 * a newer kit gets conflicts reported rather than their files silently
 * overwritten against a record this version cannot interpret.
 */
/** A record entry is a path mapped to a hash; anything else is not a record. */
const readableEntries = (files) => {
  if (typeof files !== 'object' || files === null || Array.isArray(files)) {
    return {};
  }
  return Object.fromEntries(
    Object.entries(files).filter(([, hash]) => typeof hash === 'string'),
  );
};

/**
 * Reads a manifest defensively: an unreadable or future-versioned one is
 * treated as absent, so a consumer whose manifest was hand-edited or written by
 * a newer kit gets conflicts reported rather than their files silently
 * overwritten against a record this version cannot interpret.
 *
 * Entries are validated individually for the same reason. A non-string hash
 * compares unequal to every real one, so an entry carrying `null` would classify
 * its file as locally modified and be skipped for the rest of that consumer's
 * life — a silent, permanent opt-out of updates that reads as a respected edit.
 */
export const parseManifest = (raw, version) => {
  if (typeof raw !== 'string' || raw.trim() === '') {
    return emptyManifest(version);
  }
  try {
    const parsed = JSON.parse(raw);
    if (parsed?.version !== MANIFEST_VERSION) return emptyManifest(version);
    return {
      files: readableEntries(parsed.files),
      packageVersion:
        typeof parsed.packageVersion === 'string'
          ? parsed.packageVersion
          : version,
      version: MANIFEST_VERSION,
    };
  } catch {
    return emptyManifest(version);
  }
};

export const nextManifest = ({ entries, previous, version }) => {
  // The accumulator is allocated here and never escapes, so writing into it is
  // the allowed form of mutation; rebuilding the object per entry is quadratic
  // on a manifest that grows with every shipped file.
  const files = entries.reduce(
    (accumulated, entry) => {
      if (isRecorded(entry.state)) accumulated[entry.path] = entry.incomingHash;
      return accumulated;
    },
    { ...previous.files },
  );
  return { files, packageVersion: version, version: MANIFEST_VERSION };
};

export const serialiseManifest = (manifest) =>
  `${JSON.stringify(
    {
      files: Object.fromEntries(
        Object.entries(manifest.files).sort(([left], [right]) =>
          left.localeCompare(right),
        ),
      ),
      packageVersion: manifest.packageVersion,
      version: manifest.version,
    },
    undefined,
    2,
  )}\n`;
