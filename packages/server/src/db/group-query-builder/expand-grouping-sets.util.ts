import type { GroupingMode } from './group-query-builder.types.ts';

import { expandCubeSets } from './expand-cube-sets.util.ts';

type ExpandGroupingSetsArgs = {
  readonly grouping: GroupingMode;
  readonly keys: readonly string[];
};

/**
 * The grouping sets to emit, in Postgres's own order — most specific first,
 * grand total last.
 *
 * ADR-059 expands here rather than emitting `ROLLUP(…)`/`CUBE(…)` sugar: the
 * planner normalises both into the same node, so expansion is free, and the
 * guard rails need this list anyway to bound the result. Keeping it over key
 * *names* rather than SQL text is what lets this file's whole suite be array
 * equality.
 *
 * The record is closed over `GroupingMode`, so a new mode is a compile error
 * here rather than a silent fallthrough — and that is exactly how cube arrived.
 * `flat` and `rollup` are prefixes of the key list and differ only in how many
 * they emit, so each is a count; cube's sets are subsets, so it needed a real
 * expansion and has its own file.
 */
export const expandGroupingSets = ({
  grouping,
  keys,
}: ExpandGroupingSetsArgs): readonly (readonly string[])[] => {
  const setsByMode: Readonly<
    Record<GroupingMode, () => readonly (readonly string[])[]>
  > = {
    cube: () => expandCubeSets({ keys }),
    // A copy rather than `keys` itself: every mode hands back arrays it
    // allocated, so nothing here can alias the caller's key list. `readonly`
    // says so in this repo and is erased for a published consumer, where a
    // mutation would reach back into their own array.
    flat: () => [[...keys]],
    // n+1: one per key dropped from the tail, down to the empty grand total.
    rollup: () =>
      Array.from({ length: keys.length + 1 }, (_, dropped) =>
        keys.slice(0, keys.length - dropped),
      ),
  };

  return setsByMode[grouping]();
};
