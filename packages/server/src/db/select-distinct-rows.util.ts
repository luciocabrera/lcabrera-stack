import type { QueryResultRow } from 'pg';

import type { ExecutorOptions } from './db.types.ts';
import type { SelectQueryDescriptor } from './query-builder/query-builder.types.ts';

import { selectRows } from './select-rows.util.ts';

export const selectDistinctRows = async <TRow extends QueryResultRow>(
  descriptor: ExecutorOptions & SelectQueryDescriptor,
): Promise<readonly TRow[]> =>
  selectRows<TRow>({ ...descriptor, distinct: true });
