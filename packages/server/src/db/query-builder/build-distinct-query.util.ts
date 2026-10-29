import type { SelectQueryDescriptor } from './query-builder.types.ts';

import { buildRowsRead } from './build-rows-read.util.ts';

/** @deprecated Use `buildReadQuery` from `@lcabrera/server/db/query-builder/build-read-query.util` with `distinct: true`. */
export const buildDistinctQuery = (descriptor: SelectQueryDescriptor) =>
  buildRowsRead({ ...descriptor, distinct: true });
