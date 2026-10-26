import type { GroupQueryDescriptor } from './group-query-builder.types.ts';

import { buildGroupedRead } from './build-grouped-read.util.ts';

/** @deprecated Use `buildReadQuery` from `@lcabrera/server/db/query-builder/build-read-query.util`. */
export const buildGroupQuery = (descriptor: GroupQueryDescriptor) =>
  buildGroupedRead(descriptor);
