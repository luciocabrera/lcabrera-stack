import type { QueryRefusalReason } from './errors.types.ts';

import { QUERY_REFUSED_MESSAGES } from './errors.constants.ts';

export const isQueryRefusalReason = (
  value: unknown,
): value is QueryRefusalReason =>
  typeof value === 'string' && Object.hasOwn(QUERY_REFUSED_MESSAGES, value);
