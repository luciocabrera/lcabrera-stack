/**
 * Keeps the per-day skill and subagent tallies the transcripts will stop being
 * able to answer for, so expiry does not quietly shrink every count.
 *
 * The merge is monotone and nothing prunes, so a recorded observation span can
 * never be taken back: one is claimed only from a read that reports itself
 * complete and unnarrowed. An unreadable snapshot is moved aside, not replaced.
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

const trackedRetention = ({ days, recorded, today }) =>
  recorded?.days === days ? recorded : { days, since: today };

const reachOf = ({ today, tracked }) =>
  tracked === undefined
    ? today
    : laterDay(shiftDay(today, -(tracked.days - 1)), tracked.since);

const vouchesForCoverage = (read) =>
  read.complete && read.readFrom === undefined;

const spanFor = ({ read, today, tracked }) =>
  vouchesForCoverage(read)
    ? { from: reachOf({ today, tracked }), to: today }
    : undefined;

export const observationFor = ({
  clockOverridden,
  read,
  retention,
  stored,
  today,
}) => {
  if (clockOverridden) {
    return { retention: stored.retention, span: undefined };
  }
  const tracked = retention.simulated
    ? stored.retention
    : trackedRetention({
        days: retention.days,
        recorded: stored.retention,
        today,
      });
  return { retention: tracked, span: spanFor({ read, today, tracked }) };
};

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

const freeTarget = (base, taken = 0) => {
  const target =
    taken === 0 ? `${base}.unreadable` : `${base}-${taken}.unreadable`;
  return existsSync(target) ? freeTarget(base, taken + 1) : target;
};

const setAside = ({ observedAt, path, reason }) => {
  const movedTo = freeTarget(
    `${path}.${String(observedAt).replaceAll(/[^\dA-Za-z]/gu, '')}`,
  );
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

export const readSnapshot = ({ observedAt, path }) => {
  if (!existsSync(path)) {
    return emptySnapshot();
  }
  const { parsed, unreadable } = parseFile(path);
  if (unreadable !== undefined) {
    return setAside({ observedAt, path, reason: unreadable });
  }
  return parsed?.version === SNAPSHOT_VERSION
    ? { ...emptySnapshot(), ...parsed }
    : setAside({
        observedAt,
        path,
        reason: `it declares version ${JSON.stringify(parsed?.version)} and this report writes version ${SNAPSHOT_VERSION}`,
      });
};

export const writeSnapshot = ({
  days,
  observed,
  path,
  retention,
  updatedAt,
}) => {
  mkdirSync(dirname(path), { recursive: true });
  const snapshot = {
    days,
    observed,
    retention,
    updatedAt,
    version: SNAPSHOT_VERSION,
  };
  writeFileSync(path, `${JSON.stringify(snapshot, null, 2)}\n`);
  return snapshot;
};
