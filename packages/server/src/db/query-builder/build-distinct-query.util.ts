import type {
  BuiltQuery,
  SelectQueryDescriptor,
} from './query-builder.types.ts';

import { buildSelectQuery } from './build-select-query.util.ts';

export const buildDistinctQuery = (
  descriptor: SelectQueryDescriptor,
): BuiltQuery => buildSelectQuery({ ...descriptor, distinct: true });
