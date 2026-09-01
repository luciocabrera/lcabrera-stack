import type {
  ColumnCapabilityRow,
  DistinctEstimate,
} from './group-query-builder.types.ts';

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
