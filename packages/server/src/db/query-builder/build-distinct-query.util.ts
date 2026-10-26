import type { SelectQueryDescriptor } from './query-builder.types.ts';

import { buildReadQuery } from './build-read-query.util.ts';

/** @deprecated Use `buildReadQuery` from `@lcabrera/server/db/query-builder/build-read-query.util` with `distinct: true`. */
export const buildDistinctQuery = (descriptor: SelectQueryDescriptor) =>
  buildReadQuery({ ...descriptor, distinct: true });
