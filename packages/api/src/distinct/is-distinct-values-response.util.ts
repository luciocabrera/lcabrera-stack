import type { DistinctValuesResponse } from './distinct.types.ts';

export const isDistinctValuesResponse = (
  value: unknown,
): value is DistinctValuesResponse =>
  typeof value === 'object' &&
  value !== null &&
  'hasMore' in value &&
  'values' in value &&
  typeof value.hasMore === 'boolean' &&
  Array.isArray(value.values) &&
  value.values.every((entry) => typeof entry === 'string');
