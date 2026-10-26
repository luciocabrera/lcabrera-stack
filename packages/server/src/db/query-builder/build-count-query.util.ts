import type { CountQueryDescriptor } from './query-builder.types.ts';

import { buildReadQuery } from './build-read-query.util.ts';

/** @deprecated Use `buildReadQuery` from `@lcabrera/server/db/query-builder/build-read-query.util` with `count: true`. */
export const buildCountQuery = (descriptor: CountQueryDescriptor) =>
  buildReadQuery({ ...descriptor, count: true });
