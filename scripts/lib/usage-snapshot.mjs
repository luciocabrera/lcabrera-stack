/**
 * Keeps the per-day skill and subagent tallies the transcripts will stop being
 * able to answer for, so expiry does not quietly shrink every count.
 *
 * It is deliberately monotone — a day is added and never removed, and a day seen
 * twice keeps the larger count — so a run that reads fewer transcripts than the
 * last one cannot lower a number. That only holds while the file survives, so an
 * unreadable or version-mismatched snapshot is moved aside rather than replaced.
 * It is local and gitignored (ADR-049).
 */
import {
  existsSync,
  mkdirSync,
  readFileSync,
  renameSync,
  writeFileSync,
} from 'node:fs';
import { dirname } from 'node:path';

import { sumDays } from './usage-window.mjs';

export const SNAPSHOT_VERSION = 1;

export const emptySnapshot = () => ({
  days: { skills: {}, subagents: {} },
  version: SNAPSHOT_VERSION,
});

const mergeDays = (kept, seen) => {
  const merged = { ...kept };
  for (const [day, count] of Object.entries(seen)) {
    merged[day] = Math.max(merged[day] ?? 0, count);
  }
  return merged;
};

const mergeKind = (kept, seen) => {
  const merged = {};
  for (const name of new Set([...Object.keys(kept), ...Object.keys(seen)])) {
    merged[name] = mergeDays(kept[name] ?? {}, seen[name] ?? {});
  }
  return merged;
};

export const mergeTally = (snapshotDays, liveTally) => ({
  skills: mergeKind(snapshotDays.skills ?? {}, liveTally.skills ?? {}),
  subagents: mergeKind(snapshotDays.subagents ?? {}, liveTally.subagents ?? {}),
});

export const earliestDay = (days) => {
  const all = Object.values(days).flatMap((byName) =>
    Object.values(byName).flatMap((byDay) => Object.keys(byDay)),
  );
  return all.reduce(
    (earliest, day) =>
      earliest === undefined || day < earliest ? day : earliest,
    undefined,
  );
};

export const countsFor = ({ live, merged, name, window }) => {
  const mergedTotal = sumDays({
    counts: merged[name] ?? {},
    from: window.start,
    to: window.end,
  });
  const fromTranscripts = sumDays({
    counts: live[name] ?? {},
    from: window.start,
    to: window.end,
  });
  return {
    carriedFromSnapshot: Math.max(mergedTotal - fromTranscripts, 0),
    fromTranscripts: Math.min(fromTranscripts, mergedTotal),
    total: mergedTotal,
  };
};

const setAside = ({ path, reason, timestamp }) => {
  const movedTo = `${path}.${String(timestamp).replaceAll(/[^\dA-Za-z]/gu, '')}.unreadable`;
  try {
    renameSync(path, movedTo);
  } catch (error) {
    throw new Error(
      `the snapshot at ${path} could not be read (${reason}) and could not be moved aside (${error.message}); refusing to overwrite the only copy`,
    );
  }
  return { ...emptySnapshot(), setAside: { movedTo, reason } };
};

const parseFile = (path) => {
  try {
    return { parsed: JSON.parse(readFileSync(path, 'utf8')) };
  } catch (error) {
    return { unreadable: error.message };
  }
};

export const readSnapshot = ({ path, timestamp }) => {
  if (!existsSync(path)) {
    return emptySnapshot();
  }
  const { parsed, unreadable } = parseFile(path);
  if (unreadable !== undefined) {
    return setAside({ path, reason: unreadable, timestamp });
  }
  return parsed?.version === SNAPSHOT_VERSION
    ? { ...emptySnapshot(), ...parsed }
    : setAside({
        path,
        reason: `it declares version ${JSON.stringify(parsed?.version)} and this report writes version ${SNAPSHOT_VERSION}`,
        timestamp,
      });
};

export const writeSnapshot = ({ days, path, updatedAt }) => {
  mkdirSync(dirname(path), { recursive: true });
  const snapshot = { days, updatedAt, version: SNAPSHOT_VERSION };
  writeFileSync(path, `${JSON.stringify(snapshot, null, 2)}\n`);
  return snapshot;
};
