import { isObject } from '@lcabrera/utils/guards/is-object.util';

import type { EnterpriseOrdersResponse } from './enterpriseOrders.types';

const isTaggedOrAbsent = (value: unknown) =>
  value === undefined || (isObject(value) && typeof value.kind === 'string');

export const isEnterpriseOrdersResponse = (
  value: unknown,
): value is EnterpriseOrdersResponse =>
  isObject(value) &&
  Array.isArray(value.data) &&
  typeof value.hasMore === 'boolean' &&
  (value.total === undefined || typeof value.total === 'number') &&
  isTaggedOrAbsent(value.error) &&
  isTaggedOrAbsent(value.groupingWarning);
