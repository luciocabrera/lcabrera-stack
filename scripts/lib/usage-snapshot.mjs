/**
 * Keeps the per-day skill and subagent tallies that the transcripts will stop
 * being able to answer for.
 *
 * Claude Code deletes transcripts after `cleanupPeriodDays`, so a pure reader
 * loses a retention period of history every retention period — quietly, because
 * the numbers simply get smaller. This snapshot is the one piece of local state
 * the report keeps, and it is deliberately monotone: a day is added and never
 * removed, and a day seen twice keeps the larger count, so a run that reads
 * fewer transcripts than the last one cannot lower a number.
 *
 * It is local and gitignored (ADR-049). It is a record of one machine's own
 * work, not a shared measurement, and committing it would put a count in git
 * that is stale from the next run onward.
 */
import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs';
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
  return all.length === 0 ? undefined : all.toSorted()[0];
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

export const readSnapshot = (path) => {
  if (!existsSync(path)) {
    return emptySnapshot();
  }
  try {
    const parsed = JSON.parse(readFileSync(path, 'utf8'));
    return parsed?.version === SNAPSHOT_VERSION
      ? { ...emptySnapshot(), ...parsed }
      : emptySnapshot();
  } catch {
    return emptySnapshot();
  }
};

export const writeSnapshot = ({ days, path, updatedAt }) => {
  mkdirSync(dirname(path), { recursive: true });
  const snapshot = { days, updatedAt, version: SNAPSHOT_VERSION };
  writeFileSync(path, `${JSON.stringify(snapshot, null, 2)}\n`);
  return snapshot;
};
