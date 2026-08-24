import type {
  ColumnCapabilityRow,
  DistinctEstimate,
} from './group-query-builder.types.ts';

/**
 * Turns `pg_stats.n_distinct` into a usable estimate, keeping the three meanings of "no
 * number" apart — which is the whole point (ADR-058).
 * A negative `n_distinct` is a fraction of the row count, so it has to be multiplied out;
 * `-1` means every row is distinct.
 */
export const resolveDistinctEstimate = ({
  hasStats,
  nDistinct,
  relTuples,
}: Pick<
  ColumnCapabilityRow,
  'hasStats' | 'nDistinct' | 'relTuples'
>): DistinctEstimate => {
  if (!hasStats) {
    return { kind: 'unknown' };
  }

  // Before the `relTuples` check on purpose: an empty table still reports the
  // zero, and it means the same thing there as anywhere else.
  if (nDistinct === 0) {
    return { kind: 'undefinedDistinctness' };
  }

  if (relTuples <= 0) {
    return { kind: 'unknown' };
  }

  return {
    kind: 'known',
    value:
      nDistinct > 0 ? Math.ceil(nDistinct) : Math.ceil(-nDistinct * relTuples),
  };
};
