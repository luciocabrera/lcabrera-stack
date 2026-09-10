import type { BuiltGroupAggregate } from '../group-query-builder/group-query-builder.types';

export const isUnexpandedCount = (aggregate: BuiltGroupAggregate) =>
  aggregate.fn === 'count' &&
  aggregate.column === undefined &&
  aggregate.axis === undefined;
