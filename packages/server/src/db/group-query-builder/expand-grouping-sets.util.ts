import type { GroupingMode } from './group-query-builder.types.ts';

type ExpandGroupingSetsArgs = {
  readonly grouping: GroupingMode;
  readonly keys: readonly string[];
};

/**
 * The grouping sets to emit, in Postgres's own order — most specific first,
 * grand total last.
 *
 * ADR-059 expands here rather than emitting `ROLLUP(…)` sugar: the planner
 * normalises both into the same node, so expansion is free, and the guard rails
 * need this list anyway to bound the result. Keeping it over key *names* rather
 * than SQL text is what lets this file's whole suite be array equality.
 *
 * Both modes are prefixes of the key list and differ only in how many they
 * emit, so the mode selects a count rather than a shape. The record is closed
 * over `GroupingMode`, which is what makes adding `cube` a compile error here —
 * cube's sets are not prefixes, so it needs a real expansion, not an entry.
 */
export const expandGroupingSets = ({
  grouping,
  keys,
}: ExpandGroupingSetsArgs): readonly (readonly string[])[] => {
  const setCountByMode: Readonly<Record<GroupingMode, number>> = {
    flat: 1,
    // n+1: one per key dropped from the tail, down to the empty grand total.
    rollup: keys.length + 1,
  };

  return Array.from({ length: setCountByMode[grouping] }, (_, dropped) =>
    keys.slice(0, keys.length - dropped),
  );
};
