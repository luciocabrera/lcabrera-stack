import { isObject } from '@lcabrera/utils/guards/is-object.util';

import type { EnterpriseOrdersResponse } from './enterpriseOrders.types';

/**
 * A member of one of the response's plain discriminated unions, or nothing.
 *
 * Only the discriminant is checked, on purpose: the server already built the
 * union, and re-deriving its arms here would put a second copy of the shape in
 * the client — which is what mapping to plain data at the loader edge exists to
 * avoid.
 */
const isTaggedOrAbsent = (value: unknown) =>
  value === undefined || (isObject(value) && typeof value.kind === 'string');

/**
 * Guard for the paginated orders payload.
 *
 * `total` is optional and must stay that way: the server counts only on the
 * first page of a scroll session (#402), so a load-more page legitimately
 * omits it — but a `total` that is present and not a number is a real
 * mismatch, not an absent count.
 */
export const isEnterpriseOrdersResponse = (
  value: unknown,
): value is EnterpriseOrdersResponse =>
  isObject(value) &&
  Array.isArray(value.data) &&
  typeof value.hasMore === 'boolean' &&
  (value.total === undefined || typeof value.total === 'number') &&
  isTaggedOrAbsent(value.error) &&
  isTaggedOrAbsent(value.groupingWarning);
