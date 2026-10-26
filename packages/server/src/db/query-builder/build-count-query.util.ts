import type { CountQueryDescriptor } from './query-builder.types.ts';

import { buildCountRead } from './build-count-read.util.ts';

/** @deprecated Use `buildReadQuery` from `@lcabrera/server/db/query-builder/build-read-query.util` with `count: true`. */
export const buildCountQuery = (descriptor: CountQueryDescriptor) =>
  buildCountRead(descriptor);
