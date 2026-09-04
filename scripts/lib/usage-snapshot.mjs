/**
 * Keeps the per-day skill and subagent tallies the transcripts will stop being
 * able to answer for, so expiry does not quietly shrink every count.
 *
 * It is deliberately monotone — a day is added and never removed, and a day seen
 * twice keeps the larger count — so a run that reads fewer transcripts than the
 * last one cannot lower a number. It also records the spans each run could
 * observe, because a day with no invocation leaves no entry and a recorded day
 * is therefore evidence of a record, never of coverage. That only holds while the file survives, so an
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

import { shiftDay, sumDays } from './usage-window.mjs';

export const SNAPSHOT_VERSION = 1;

export const emptySnapshot = () => ({
  days: { skills: {}, subagents: {} },
  observed: [],
  version: SNAPSHOT_VERSION,
});

const isSpan = (span) =>
  typeof span?.from === 'string' && typeof span?.to === 'string';

const laterDay = (...days) =>
  days.toSorted((a, b) => a.localeCompare(b)).at(-1);

const absorb = (merged, span) => {
  const last = merged.at(-1);
  if (last === undefined || span.from > shiftDay(last.to, 1)) {
    return [...merged, span];
  }
  return [
    ...merged.slice(0, -1),
    { from: last.from, to: laterDay(last.to, span.to) },
  ];
};

export const mergeObserved = (kept, span) =>
  [...kept, ...(span === undefined ? [] : [span])]
    .filter((entry) => isSpan(entry))
    .toSorted((a, b) => a.from.localeCompare(b.from))
    .reduce((merged, entry) => absorb(merged, entry), []);

export const observedBackTo = ({ observed, to }) =>
  observed.find((span) => span.from <= to && span.to >= to)?.from;

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

export const writeSnapshot = ({ days, observed, path, updatedAt }) => {
  mkdirSync(dirname(path), { recursive: true });
  const snapshot = { days, observed, updatedAt, version: SNAPSHOT_VERSION };
  writeFileSync(path, `${JSON.stringify(snapshot, null, 2)}\n`);
  return snapshot;
};
