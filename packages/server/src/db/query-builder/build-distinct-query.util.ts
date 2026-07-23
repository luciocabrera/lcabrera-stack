import type {
  BuiltQuery,
  SelectQueryDescriptor,
} from './query-builder.types.ts';

import { buildSelectQuery } from './build-select-query.util.ts';

/**
 * The `SELECT DISTINCT` sibling of `buildSelectQuery` — same descriptor (a list
 * of `fields`, plus optional `filters`/`sort`/pagination/`allowedColumns`); the
 * only difference is that it deduplicates the projected rows. A thin wrapper so
 * the two builders never drift, and so callers read `buildDistinctQuery(...)`
 * rather than remembering a `distinct: true` flag.
 *
 * Deliberately generic: a single-column filter-option dropdown is one use of it,
 * not its definition — that specialization lives in `selectFilterOptions`, which
 * composes this.
 */
export const buildDistinctQuery = (
  descriptor: SelectQueryDescriptor,
): BuiltQuery => buildSelectQuery({ ...descriptor, distinct: true });
