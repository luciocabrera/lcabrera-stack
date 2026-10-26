import type { SelectQueryDescriptor } from './query-builder.types.ts';

import { buildReadQuery } from './build-read-query.util.ts';

/** @deprecated Use `buildReadQuery` from `@lcabrera/server/db/query-builder/build-read-query.util`. */
export const buildSelectQuery = (descriptor: SelectQueryDescriptor) =>
  buildReadQuery(descriptor);
