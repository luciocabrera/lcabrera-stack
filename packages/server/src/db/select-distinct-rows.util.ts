import type { QueryResultRow } from 'pg';

import type { ExecutorOptions } from './db.types.ts';
import type { SelectQueryDescriptor } from './query-builder/query-builder.types.ts';

import { selectRows } from './select-rows.util.ts';

/**
 * The `SELECT DISTINCT` sibling of `selectRows` — same descriptor, deduplicated
 * rows. A thin wrapper (identical to `selectRows({ ...descriptor, distinct:
 * true })`) so the two never drift and callers can read the intent. `tx` rides
 * along with the rest of the descriptor.
 *
 * For a single column's distinct values shaped for a filter dropdown, reach for
 * `selectFilterOptions`, which composes this — do not re-specialize the generic.
 */
export const selectDistinctRows = async <TRow extends QueryResultRow>(
  descriptor: ExecutorOptions & SelectQueryDescriptor,
): Promise<readonly TRow[]> =>
  selectRows<TRow>({ ...descriptor, distinct: true });
