import type { GroupQueryDescriptor } from './group-query-builder.types.ts';

import { buildReadQuery } from '../query-builder/build-read-query.util.ts';

/** @deprecated Use `buildReadQuery` from `@lcabrera/server/db/query-builder/build-read-query.util`. */
export const buildGroupQuery = (descriptor: GroupQueryDescriptor) =>
  buildReadQuery(descriptor);
