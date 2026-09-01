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

const WRITTEN_STATES = new Set(['added', 'restored', 'updated']);

export const isWritten = (state) => WRITTEN_STATES.has(state);

const RECORDED_STATES = new Set(['added', 'current', 'restored', 'updated']);

export const isRecorded = (state) => RECORDED_STATES.has(state);

const REPORTED_STATES = new Set([
  'conflict',
  'modified',
  'unmet',
  'unresolved',
]);

export const isReported = (state) => REPORTED_STATES.has(state);

const ACKNOWLEDGEABLE_STATES = new Set(['conflict', 'modified']);

export const isAcknowledgeable = (state) => ACKNOWLEDGEABLE_STATES.has(state);

export const acknowledgeableStates = () =>
  [...ACKNOWLEDGEABLE_STATES].toSorted((left, right) =>
    left.localeCompare(right),
  );

export const ACKNOWLEDGED_STATE = 'acknowledged';

export const isAcknowledged = (state) => state === ACKNOWLEDGED_STATE;

export const emptyManifest = (version) => ({
  files: {},
  packageVersion: version,
  version: MANIFEST_VERSION,
});

const readableEntries = (files) => {
  if (typeof files !== 'object' || files === null || Array.isArray(files)) {
    return {};
  }
  return Object.fromEntries(
    Object.entries(files).filter(([, hash]) => typeof hash === 'string'),
  );
};

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
