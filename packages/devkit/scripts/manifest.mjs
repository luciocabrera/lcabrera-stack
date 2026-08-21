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

/**
 * The states a consumer needs to see: their edit survived, the path was already
 * taken, or the file asks for something they have not configured — a command it
 * interpolates (`unresolved`) or a config key it declares (`unmet`).
 *
 * Both of the last two are reported here and in neither set above, which is the
 * whole of what "refused" means: a file that could not be honoured is never
 * written, and never recorded either — recording it would make the next run read
 * its absence as a deletion the consumer chose.
 */
const REPORTED_STATES = new Set([
  'conflict',
  'modified',
  'unmet',
  'unresolved',
]);

export const isReported = (state) => REPORTED_STATES.has(state);

/**
 * The states an acknowledgement applies to, and the state it produces. All of it
 * lives here with the rest of the vocabulary so none of it can drift from the
 * classifier that emits the first ones.
 *
 * `conflict` belongs here alongside `modified`, and leaving it out is what made
 * `doctor --check` unusable as a gate. The two differ in bookkeeping — a
 * `modified` file has a recorded hash because devkit wrote it, a `conflict` has
 * none because the consumer's file was already there — but they are the same
 * human situation: this file is mine on purpose, stop reporting it. A repository
 * that authored its own register before adopting the kit holds that state
 * permanently and legitimately, so without this the check is red on a correct
 * tree, and a gate that is always red is read exactly like one that is always
 * green.
 *
 * Acknowledging a conflict is not adopting it. The package's version is still
 * never written over the consumer's file.
 */
const ACKNOWLEDGEABLE_STATES = new Set(['conflict', 'modified']);

export const isAcknowledgeable = (state) => ACKNOWLEDGEABLE_STATES.has(state);

/** For a message that has to name them; sorted so the wording cannot reorder. */
export const acknowledgeableStates = () =>
  [...ACKNOWLEDGEABLE_STATES].toSorted((left, right) =>
    left.localeCompare(right),
  );

export const ACKNOWLEDGED_STATE = 'acknowledged';

/**
 * An acknowledged edit sits in NONE of the three sets above, which is the whole
 * of what acknowledgement means. Not written: the edit stands, exactly as
 * `modified` did. Not reported: that is the point of acknowledging it. And not
 * recorded — recording the edited content's hash would make the next run compare
 * the package against the consumer's edit rather than against the baseline it
 * last wrote, so `updated` and `current` would swap places for that file.
 *
 * It gets its own predicate rather than joining a set, so `--verbose` can list
 * it with the reason given for it: quiet is not the same as gone.
 */
export const isAcknowledged = (state) => state === ACKNOWLEDGED_STATE;

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
