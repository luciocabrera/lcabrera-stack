import { isObject } from '@lcabrera/utils/guards/is-object.util';

import type { TablePageResponseShape } from './table-page.types.ts';

const isTaggedOrAbsent = (value: unknown) =>
  value === undefined || (isObject(value) && typeof value.kind === 'string');

export const isTablePageResponse = <
  TResponse extends TablePageResponseShape = TablePageResponseShape,
>(
  value: unknown,
): value is TResponse =>
  isObject(value) &&
  Array.isArray(value.data) &&
  typeof value.hasMore === 'boolean' &&
  (value.total === undefined || typeof value.total === 'number') &&
  isTaggedOrAbsent(value.error) &&
  isTaggedOrAbsent(value.groupingWarning);
